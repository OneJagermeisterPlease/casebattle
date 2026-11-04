"""Генерация фоновых сцен для обложек кейсов локальной моделью SD-Turbo (CPU).

Запуск (нужен Python 3.12 с torch, diffusers, transformers, accelerate, pillow):
    python tools/gen_scenes.py [--only rocket,dragon] [--steps 4] [--variants 1]

Картинки сохраняются в apps/web/public/cases/scenes/<icon>.webp.
Модель: stabilityai/sd-turbo (Stability AI Community License — некоммерческое использование ок).
"""
import argparse
import pathlib
import time

import torch
from diffusers import AutoPipelineForText2Image

OUT = pathlib.Path(__file__).resolve().parent.parent / "apps/web/public/cases/scenes"

STYLE = (
    "highly detailed digital painting, game key art, cinematic dramatic lighting, rim light, volumetric glow, "
    "rich saturated colors, depth of field, octane render look, no text, no letters, no logo, no watermark"
)

SCENES = {
    "star": "golden stars and cosmic light burst over a dark arena, sparkling particles",
    "gem": "giant glowing crystals and gemstones in a dark cave, prismatic light",
    "crown": "royal treasure vault with golden crown, piles of gold coins, velvet and marble",
    "knife": "blacksmith forge with glowing molten steel blades, sparks flying, dark workshop",
    "glove": "tactical gloves on an armory table, neon backlight, carbon fiber textures",
    "skull": "haunted gothic crypt with glowing skulls, green fog, candles",
    "bolt": "electric storm with lightning bolts over a futuristic city, blue energy",
    "shield": "medieval steel shield and fortress walls at sunset, heroic atmosphere",
    "target": "military shooting range with holographic targets, red laser sights, night",
    "moon": "full moon over misty dark forest, purple night sky, glowing fireflies",
    "leaf": "lush jungle with sunbeams through giant leaves, camouflage greens",
    "flame": "roaring inferno flames and embers, burning ruins, orange glow",
    "box": "military supply crates in a dark warehouse, dramatic spotlight",
    "pumpkin": "halloween night with carved glowing jack-o-lanterns, bats, full moon, spooky graveyard",
    "snowflake": "new year winter night, snowy pine forest with festive lights, fireworks, aurora",
    "heart": "romantic valentine scene with glowing pink hearts, roses and soft bokeh",
    "flower": "spring flower garden with tulips and mimosa, soft pastel sunlight, petals in the air",
    "medal": "military parade ground with medals, flags, armored vehicles at golden hour",
    "gift": "birthday party with gift boxes, balloons, confetti and neon lights",
    "biohazard": "zombie apocalypse ruined city, toxic green fog, abandoned cars, biohazard signs",
    "rocket": "rocket launching into deep space, nebula, planets and stars",
    "chip": "cyberpunk neon city street at night, rain, holograms, magenta and cyan lights",
    "cowboy": "wild west desert town at sunset, saloon, cacti, dust and warm orange sky",
    "anchor": "pirate ship on stormy sea, treasure chest, lanterns, moonlight on waves",
    "katana": "japanese temple with cherry blossoms, katana on a stand, red torii gate, mist",
    "dragon": "epic fantasy dragon silhouette over a castle, magic fire, mountains",
    "fedora": "film noir rainy city street at night, neon signs, venetian blind shadows, smoke",
    "gasmask": "post-apocalyptic wasteland, rusted wreckage, dust storm, radiation glow",
    "flag": "night street racing with neon sports cars, motion streaks, checkered flag",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--steps", type=int, default=4)
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(max(1, torch.get_num_threads()))
    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", torch_dtype=torch.float32)
    pipe.set_progress_bar_config(disable=True)

    names = [n for n in args.only.split(",") if n] or list(SCENES)
    for name in names:
        t = time.time()
        img = pipe(
            prompt=f"{SCENES[name]}, {STYLE}",
            num_inference_steps=args.steps,
            guidance_scale=0.0,
            width=args.size,
            height=args.size,
            generator=torch.Generator().manual_seed(args.seed),
        ).images[0]
        img.save(OUT / f"{name}.webp", quality=88)
        print(f"{name}: {time.time() - t:.1f}s", flush=True)


if __name__ == "__main__":
    main()
