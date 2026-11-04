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
    "esports splash art, semi-realistic glossy digital painting, neon rim light, "
    "vivid saturated red purple blue orange colors, high contrast, dramatic, sharp detail"
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
    # Серийные
    "koshmar": "nightmare creature in a dark abandoned hospital, glowing eyes, fog",
    "zombi": "zombie horde attacking a barricade in a ruined city, toxic green fog, survivor with rifle",
    "manyak": "masked slasher with a chainsaw in a dark barn, red emergency light",
    "vedma": "evil witch casting green magic in a haunted forest, cauldron, full moon",
    "demon": "horned demon rising from lava and hellfire, burning city",
    "kovboy": "lone cowboy gunslinger in a desert town at sunset, saloon, revolver",
    "pirat": "pirate captain on a ship deck in a storm, treasure chest, lanterns",
    "detektiv": "film noir detective in trench coat and fedora, rainy night street, neon sign",
    "samuray": "samurai warrior with katana under cherry blossoms, red torii gate, moon",
    "naemnik": "cyberpunk mercenary with neon implants on a rainy rooftop, holograms",
    "astronavt": "astronaut soldier floating near a space station, nebula, planets",
    "stalker": "stalker in a gas mask in a radioactive wasteland, rusted cars",
    "gonschik": "street racer in neon sports car drifting at night, motion streaks",
    "android": "chrome android soldier with glowing blue eyes in a futuristic lab",
    "prishelets": "alien invader with a plasma rifle, flying saucers over a city",
    "tserber": "three-headed hellhound cerberus breathing fire at the gates of hell",
    "grifon": "golden griffin flying over mountain peaks at sunrise",
    "kraken": "giant kraken attacking a warship in a stormy ocean",
    "feniks": "flaming phoenix rising from ashes, explosion of fire and embers",
    "drakon": "giant dragon breathing fire over a burning castle, epic",
    # Стиль
    "graffiti": "graffiti covered alley, spray paint explosion, street artist with mask",
    "neon": "neon tokyo street at night, glowing signs, rain reflections",
    "retro": "80s synthwave sunset, palm trees, chrome sports car, grid horizon",
    "kamuflyazh": "sniper in ghillie suit hidden in a forest, camouflage",
    "mramor": "marble greek statue with gold veins, ancient temple",
    "doppler": "deep space nebula with blue and ruby swirls, glowing crystal blade",
    "gradient": "abstract liquid gradient energy waves from purple to orange",
    "hischniki": "roaring tiger and wolf in a dark jungle, glowing eyes",
    "okean": "underwater scene with great white shark, coral reef, sunken treasure",
    "plamya": "wall of fire, burning city, flying embers",
    # Фирменные (праздники и турниры)
    "hellouin": "spooky halloween night, scarecrow in a pumpkin field, full moon, bats, haunted house",
    "novyy-god": "new year eve, soldier in winter gear with sparklers, snowy city, fireworks",
    "14-fevralya": "valentine night, roses and glowing hearts, pistol wrapped in red ribbon",
    "8-marta": "spring celebration, elegant female sniper among tulips and mimosa",
    "23-fevralya": "military parade, tanks and soldiers with flags, golden hour",
    "den-rozhdeniya": "explosive birthday party, giant cake, balloons, confetti, neon",
    "turnir": "esports tournament arena with crowd, spotlights, trophy on stage",
    "final": "grand final esports stage, confetti, golden trophy",
    "liga": "esports league players at computers on stage, blue lights",
    "kubok": "giant golden cup trophy with laurel, fireworks",
    "izumrud": "treasure vault full of glowing green emeralds",
    "rubin": "treasure vault full of glowing red rubies",
    "sapfir": "treasure vault full of glowing blue sapphires",
    "almaz": "giant shining diamond in a dark vault, light rays",
    "slitok": "stacks of gold bars in a bank vault, golden light",
    "grand-slem": "luxury casino jackpot, gold coins raining, champagne",
    "chernyy-almaz": "black diamond on velvet, purple light, luxury",
    "magnat": "billionaire in a penthouse with gold and money, city skyline",
    "imperator": "emperor on a golden throne, royal palace",
    "kripta": "golden crypto coins and holographic charts, cyber vault",
    # Хайп (без логотипов брендов и без откровенного контента)
    "pornhab": "neon nightclub at night, orange and black neon lights, velvet rope, dj booth, party silhouettes, fully clothed",
    "yagermeyster": "dark green herbal liquor bottle next to a majestic stag with glowing antlers, hunting lodge, fireplace",
    "pokernyy-dom": "luxury poker table with stacks of chips and royal flush cards, smoky casino, gangster in a suit",
    "dota-2": "epic fantasy battle between two ancient fortresses, heroes clashing at a river, magic spells, towers",
    "klaud-kod": "glowing orange AI terminal with code on dark screens, friendly robot assistant typing, futuristic developer desk",
    "belaya-berezka": "crystal vodka bottle in a snowy birch forest at night, frost, russian winter, aurora",
    "vayb-koding": "programmer with headphones coding on a neon laptop, lofi room, rgb lights, chill vibe",
    "dedlayn": "exhausted programmer at 3am surrounded by coffee cups, red alarm clock, stress, dark office",
    "prod-upal": "server room on fire, alarms flashing red, engineer with extinguisher, chaos",
    "kopipasta": "hacker copying glowing code between floating holographic screens, matrix style",
    "energetik": "exploding energy drink can with green lightning, electric splash, extreme sports",
    "rash-b": "squad of terrorists rushing through a desert bombsite at full speed, dust, explosions",
    "eys": "lone soldier standing over defeated enemies, golden light, legendary ace moment",
    "klatch-1-v-5": "last surviving soldier facing five enemies in a dark bombsite, tension, red light",
    "mid": "sniper duel across a sandy desert street with arches, heat haze",
    "strim-24-7": "streamer in a neon gaming room with chat overlays and cameras, purple lights",
    "tekila": "tequila bottle with lime and salt in a mexican desert at sunset, cactus, mariachi",
    "viski": "glass of whiskey on ice in a dark leather lounge, cigar smoke, amber light",
    "pivfest": "beer festival with giant golden mugs, foam, bavarian tents, party",
    "absent": "glowing green absinthe with a green fairy, bohemian paris night",
    "shampanskoe": "champagne bottle exploding with golden bubbles, luxury yacht party",
    "samogon": "old copper moonshine still in a wooden barn at night, lanterns",
    "kalyannaya": "hookah lounge with thick colorful smoke, purple velvet, neon",
    "shaurma-v-3-nochi": "street food shawarma stall at 3am, neon sign, steam, hungry soldiers",
    "kazino": "luxury casino with roulette wheel, golden chips, chandeliers, jackpot",
    "lutboks": "glowing mysterious loot box opening with rays of light and rare weapons flying out",
    # Операции
    "operatsiya-groza": "special forces in a thunderstorm, lightning over a battlefield",
    "operatsiya-proryv": "soldiers breaching an enemy wall, explosion, smoke",
    "operatsiya-shtorm": "naval assault on a beach from landing boats, storm",
    "operatsiya-tsitadel": "assault on a mountain fortress at night, searchlights",
    "operatsiya-ischeyka": "tracker dog and sniper hunting in a misty forest",
}

ICON_SCENE = {
    "gem": "glowing gemstones and crystals in a treasure cave",
    "crown": "royal treasure vault with golden crown",
    "knife": "assassin wielding a combat knife",
    "glove": "special forces operator wearing tactical gloves",
    "target": "elite soldier aiming a rifle",
    "skull": "dark skull warrior",
    "moon": "night scene under full moon",
    "katana": "ninja warrior with katana",
    "flower": "geisha among sakura flowers",
    "rocket": "retro-futuristic rocket and astronaut",
    "chip": "cyberpunk hacker with neon implants",
    "bolt": "electric neon energy explosion",
    "medal": "decorated special forces soldier",
    "shield": "armored superhero soldier with shield",
    "star": "hero under falling stars",
    "box": "military supply crates",
    "leaf": "soldier in a jungle",
    "anchor": "pirate ship",
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
    slug, cat, name, icon = c["slug"], c["category"], c["name"], c.get("icon", "star")
    if c.get("imageUrl"):
        return None  # официальный кейс CS2 со своей картинкой
    if slug in FIXED:
        return FIXED[slug]
    if slug.startswith("weapon-"):
        w = re.sub(r" для всех$", "", name)
        return f"elite soldier holding a {w} {setting(slug)}, dramatic action pose, smoke and sparks"
    if slug.startswith("knife-"):
        return f"assassin wielding a {slug.removeprefix('knife-').replace('-', ' ')} knife {setting(slug)}, glowing blade, sparks"
    if slug.startswith("gloves"):
        return f"special forces operator wearing tactical gloves {setting(slug)}, close-up, gritty"
    if cat == "Бонусные":
        return f"treasure vault full of glowing gemstones and gold coins, magical light, {setting(slug)}"
    base = ICON_SCENE.get(icon, "soldier in action")
    return f"{base} {setting(slug)}, dramatic action"


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
