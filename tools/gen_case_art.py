"""Генерация уникальной иллюстрации для каждого кейса локальной моделью SD-Turbo (CPU).

Берёт список кейсов из запущенного API и рисует картинку по теме кейса.
Официальные кейсы CS2 (у них уже есть картинка) пропускаются.

    python tools/gen_case_art.py [--api http://localhost:4000] [--only slug1,slug2] [--force]

Результат: apps/web/public/cases/art/<slug>.webp и манифест apps/web/src/lib/caseArtManifest.ts.
"""
import argparse
import json
import pathlib
import re
import time
import urllib.request
import zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "apps/web/public/cases/art"
MANIFEST = ROOT / "apps/web/src/lib/caseArtManifest.ts"

STYLE = (
    "epic game key art illustration, highly detailed digital painting, dramatic cinematic lighting, "
    "vivid saturated colors, glowing rim light, sharp focus, trending on artstation, "
    "no text, no letters, no logo, no watermark"
)

COLORS = {
    "grey": "silver and steel grey", "light-blue": "light blue", "blue": "deep blue", "purple": "violet purple",
    "pink": "hot pink and magenta", "red": "blood red", "gold": "shining gold",
}

GEMS = {
    "янтарный": "amber", "ониксовый": "black onyx", "гранатовый": "red garnet", "аметистовый": "purple amethyst",
    "изумрудный": "green emerald", "турмалиновый": "pink tourmaline", "сапфировый": "blue sapphire",
    "рубиновый": "red ruby", "опаловый": "rainbow opal", "бриллиантовый": "white diamond", "чёрный-бриллиант": "black diamond",
}

FIXED = {
    "rookie": "young army recruit in a training camp at dawn, obstacle course, determined face",
    "patrol": "special forces night patrol with flashlights in a rainy city alley",
    "arsenal": "huge military armory wall full of rifles and pistols, dramatic spotlight",
    "assault": "elite assault squad breaching a door, explosion, smoke and debris",
    "veteran": "battle-hardened veteran commander with scars, burning battlefield behind",
    "all-or-nothing": "high stakes poker table in a dark underground casino, stacks of chips, a combat knife stuck in the table",
    "theme-хэллоуин": "spooky halloween night, masked scarecrow figure in a pumpkin field, full moon, bats, haunted house",
    "theme-новый-год": "new year eve, soldier in winter gear with sparklers, snowy city, fireworks, christmas lights",
    "theme-14-февраля": "valentine night, roses and glowing hearts, a pistol wrapped in red ribbon, romantic neon city",
    "theme-8-марта": "spring celebration, elegant female sniper among tulips and mimosa flowers, soft sunlight",
    "theme-23-февраля": "military parade, tanks and soldiers with flags, golden hour, heroic composition",
    "theme-день-рождения": "explosive birthday party, giant cake, balloons, confetti, neon lights, gift boxes",
    "theme-хоррор": "terrifying masked slasher in a dark abandoned mansion, flickering light, blood red tones",
    "theme-зомби-апокалипсис": "zombie horde attacking a barricade in a ruined city, toxic green fog, survivor with rifle",
    "theme-космическая-одиссея": "astronaut soldier floating near a space station, nebula, planets, rocket launch",
    "theme-киберпанк": "cyberpunk mercenary girl with neon implants on a rainy rooftop, holograms, magenta and cyan",
    "theme-дикий-запад": "lone cowboy gunslinger in a desert town at sunset, saloon, dust, revolver",
    "theme-пираты": "pirate captain on a ship deck in a storm, treasure chest, lanterns, kraken tentacles",
    "theme-самурай": "samurai warrior with katana under cherry blossoms, red torii gate, mist, moon",
    "theme-фэнтези": "knight facing a giant fire-breathing dragon above a castle, magic sparks",
    "theme-нуар": "film noir detective in trench coat and fedora, rainy night street, neon sign, smoke",
    "theme-постапокалипсис": "wasteland raider in a gas mask, rusted cars, dust storm, radioactive glow",
    "theme-гонки": "night street race, neon sports cars drifting, motion blur, checkered flag",
    "theme-градиенты": "abstract liquid gradient energy waves, fade colors from purple to orange, floating knife",
    "theme-допплер": "deep space nebula with doppler blue and ruby swirls, glowing crystal blade",
    "theme-драконы": "giant asian dragon coiling around a mountain temple, fire and clouds",
    "theme-неон": "neon tokyo street at night, glowing signs, rain reflections",
    "theme-хищники": "roaring tiger and wolf in a dark jungle, glowing eyes",
    "theme-океан": "underwater scene, great white shark, coral reef, sunken treasure",
    "theme-пламя": "inferno, wall of fire, burning city, embers",
    "theme-камуфляж": "sniper in ghillie suit hidden in a forest, camouflage",
    "theme-космос": "galaxy and planets, alien landscape, starfield",
    "theme-ядовитые": "toxic laboratory, green acid barrels, hazmat soldier",
    "theme-призраки": "ghost ship in fog, spectral skulls, eerie blue light",
    "theme-мрамор": "marble and damascus steel textures, ancient greek statue, gold veins",
    "limited-полночь": "midnight city skyline, dark purple sky, lone sniper on rooftop, full moon",
    "limited-кибер": "cyber hacker soldier with glowing visor, digital rain code, neon blue",
    "limited-ретро": "80s synthwave retro sunset, palm trees, chrome sports car, grid horizon",
    "limited-самурай": "ronin samurai in red armor, burning village, falling sakura petals",
    "limited-арктика": "arctic special forces in snow storm, ice fortress, aurora borealis",
    "limited-джекпот": "casino jackpot explosion, gold coins raining, slot machine lights, luxury",
}


SETTINGS = [
    "in a desert warzone at sunset", "in a neon cyberpunk city at night", "in snowy mountains during a blizzard",
    "in a dense jungle with mist", "on a battleship deck in a storm", "in a burning ruined city",
    "in an underground bunker with red alarm lights", "in a japanese temple with cherry blossoms",
    "on a space station with planets behind", "in a haunted gothic cathedral", "in a toxic green laboratory",
    "in a golden treasure vault", "in an arctic research base with aurora", "in a wild west canyon",
]


def setting(slug: str) -> str:
    return SETTINGS[zlib.crc32(slug.encode()) % len(SETTINGS)]


def prompt_for(c: dict) -> str | None:
    slug, cat, name = c["slug"], c["category"], c["name"]
    if c.get("imageUrl"):
        return None  # официальный кейс CS2 со своей картинкой
    if slug in FIXED:
        return FIXED[slug]
    if cat == "Цвета":
        return f"abstract {COLORS.get(slug, 'colorful')} energy explosion, floating weapon parts, smoke and sparks"
    if cat == "Премиум":
        gem = GEMS.get(slug.removeprefix("gem-"), "precious gem")
        return f"treasure vault full of glowing {gem} crystals and gold coins, luxurious, magical light"
    if cat == "Оружейные":
        w = re.sub(r" для всех$", "", name)
        return f"elite soldier holding a {w} {setting(slug)}, dramatic action pose, smoke and sparks"
    if cat == "Ножевые":
        return f"assassin wielding a {name} {setting(slug)}, glowing blade, sparks, dynamic action"
    if cat == "Перчаточные":
        return f"special forces operator wearing {name} gloves {setting(slug)}, close-up, gritty, dramatic light"
    return f"{name}, action scene, soldier, explosions"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:4000")
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--steps", type=int, default=4)
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--batch", type=int, default=4)
    args = ap.parse_args()

    cases = json.load(urllib.request.urlopen(f"{args.api}/cases"))
    only = {s for s in args.only.split(",") if s}
    todo = [(c["slug"], p) for c in cases if (p := prompt_for(c)) and (not only or c["slug"] in only)]
    OUT.mkdir(parents=True, exist_ok=True)

    import torch
    from diffusers import AutoPipelineForText2Image

    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=torch.float32)
    pipe.set_progress_bar_config(disable=True)

    todo = [(slug, p) for slug, p in todo if args.force or not (OUT / f"{slug}.webp").exists()]
    # Пачками: на CPU несколько картинок за один проход модели выходят быстрее, чем по одной.
    for start in range(0, len(todo), args.batch):
        batch = todo[start : start + args.batch]
        t = time.time()
        images = pipe(
            prompt=[f"{p}, {STYLE}" for _, p in batch],
            num_inference_steps=args.steps,
            guidance_scale=0.0,
            width=args.size,
            height=args.size,
            generator=[torch.Generator().manual_seed(zlib.crc32(slug.encode())) for slug, _ in batch],
        ).images
        for (slug, _), img in zip(batch, images):
            img.save(OUT / f"{slug}.webp", quality=86)
        print(f"[{start + len(batch)}/{len(todo)}] {time.time() - t:.1f}s", flush=True)
        write_manifest()
    write_manifest()


def write_manifest():
    slugs = sorted(p.stem for p in OUT.glob("*.webp"))
    MANIFEST.write_text(
        "// Сгенерировано tools/gen_case_art.py — список кейсов, для которых есть иллюстрация в /cases/art/<slug>.webp.\n"
        f"export const CASE_ART = new Set<string>({json.dumps(slugs, ensure_ascii=False)});\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
