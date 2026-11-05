import { RARITY_META, type CaseDTO } from '@casebattle/shared';
import { useId, type ReactNode } from 'react';
import { CASE_ART } from '@/lib/caseArtManifest';
import { CASE_ART_BLUR } from './caseArtBlur';
import './case-art.css';

/**
 * Volumetric case cover — all original vector art drawn in code (no external
 * artwork). Composition, back to front:
 *   glow + glowing ring/arc segments → raised lid whose inner face is a framed,
 *   themed illustration (neon city, frost, flame, jungle, space, toxic, vault,
 *   forge, ocean, crystal, ops radar, storm) → open gunmetal chest with bevels,
 *   rivets, metal trim and hue rim light → the case's top CS2 skin (Steam CDN
 *   image from the API data) lying diagonally across the open case → small
 *   themed props around the base.
 * The theme is derived from the case name/category/icon/hue, colours from hue.
 */

const ICONS: Record<string, string> = {
  star: 'M50 30 L56 44 L71 45 L59 55 L63 70 L50 62 L37 70 L41 55 L29 45 L44 44 Z',
  gem: 'M36 40 L64 40 L74 52 L50 76 L26 52 Z',
  crown: 'M30 66 L28 40 L40 52 L50 34 L60 52 L72 40 L70 66 Z',
  knife: 'M28 66 L44 62 L46 58 Q66 50 76 34 Q74 56 54 66 L46 66 Z',
  glove: 'M40 74 L38 50 L42 34 L47 34 L48 48 L50 30 L55 30 L55 48 L58 32 L63 32 L62 50 L66 42 L70 44 L66 62 Q62 74 52 76 Z',
  skull: 'M50 30 Q70 30 70 50 Q70 58 64 62 L64 70 L36 70 L36 62 Q30 58 30 50 Q30 30 50 30 Z',
  bolt: 'M54 28 L36 54 L48 54 L44 74 L64 46 L52 46 Z',
  shield: 'M50 28 L70 36 Q70 62 50 74 Q30 62 30 36 Z',
  target: 'M50 30 A20 20 0 1 0 50.1 30 M50 40 A10 10 0 1 0 50.1 40 M50 26 L50 74 M26 50 L74 50',
  moon: 'M58 30 A22 22 0 1 0 70 60 A16 16 0 1 1 58 30 Z',
  leaf: 'M30 70 Q30 34 70 30 Q66 70 30 70 Z',
  flame: 'M50 26 Q66 44 62 58 Q60 72 50 74 Q38 72 38 60 Q38 50 46 44 Q46 54 52 54 Q56 42 50 26 Z',
  box: 'M30 42 L50 32 L70 42 L70 64 L50 74 L30 64 Z',
  pumpkin: 'M50 34 Q72 32 72 54 Q72 74 50 72 Q28 74 28 54 Q28 32 50 34 Z M48 34 L50 24 L54 26 L52 34 Z',
  snowflake: 'M50 26 L50 74 M29 38 L71 62 M29 62 L71 38 M43 29 L50 36 L57 29 M43 71 L50 64 L57 71',
  heart: 'M50 72 C20 52 26 30 42 32 C47 33 50 37 50 40 C50 37 53 33 58 32 C74 30 80 52 50 72 Z',
  flower: 'M50 50 Q36 26 50 26 Q64 26 50 50 Q74 36 74 50 Q74 64 50 50 Q64 74 50 74 Q36 74 50 50 Q26 64 26 50 Q26 36 50 50 Z',
  medal: 'M40 24 L46 42 L54 42 L60 24 Z M50 42 A13 13 0 1 0 50.1 42 Z',
  gift: 'M30 44 H70 V72 H30 Z M28 36 H72 V44 H28 Z M50 36 Q40 22 35 31 Q37 36 50 36 Q63 22 65 31 Q63 36 50 36 Z',
  biohazard: 'M50 27 a9 9 0 1 0 0.1 0 Z M33 55 a9 9 0 1 0 0.1 0 Z M67 55 a9 9 0 1 0 0.1 0 Z',
  rocket: 'M50 24 Q62 34 60 58 L66 68 L56 66 L50 72 L44 66 L34 68 L40 58 Q38 34 50 24 Z',
  chip: 'M36 36 H64 V64 H36 Z M42 30 V36 M50 30 V36 M58 30 V36 M42 64 V70 M50 64 V70 M58 64 V70 M30 42 H36 M30 50 H36 M30 58 H36 M64 42 H70 M64 50 H70 M64 58 H70',
  cowboy: 'M24 54 Q30 62 50 62 Q70 62 76 54 Q72 58 64 56 L62 40 Q56 36 50 40 Q44 36 38 40 L36 56 Q28 58 24 54 Z',
  anchor: 'M50 24 A5 5 0 1 0 50.1 24 M50 30 L50 74 M40 38 L60 38 M30 56 Q32 72 50 74 Q68 72 70 56',
  katana: 'M66 28 Q74 26 72 32 L40 66 L34 60 Z M30 58 L42 70 M36 64 L28 72',
  dragon: 'M28 64 Q40 52 48 54 Q44 38 56 26 Q58 40 72 36 Q64 48 70 58 Q58 54 54 62 Q42 60 28 64 Z',
  fedora: 'M26 60 Q50 70 74 60 Q70 56 64 56 L62 40 Q50 32 38 40 L36 56 Q30 56 26 60 Z',
  gasmask: 'M50 28 Q68 28 68 46 Q68 60 58 64 L58 74 L42 74 L42 64 Q32 60 32 46 Q32 28 50 28 Z',
  flag: 'M34 76 L34 26 L36 26 L36 76 Z M36 28 Q46 22 54 30 Q62 36 72 30 L72 52 Q62 58 54 52 Q46 44 36 50 Z',
};

type Theme =
  | 'city' | 'frost' | 'flame' | 'jungle' | 'space' | 'toxic' | 'vault' | 'forge' | 'ocean' | 'crystal' | 'ops' | 'storm'
  | 'halloween' | 'xmas' | 'love' | 'spring' | 'military' | 'party' | 'horror' | 'zombie' | 'rocket' | 'cyber'
  | 'west' | 'pirate' | 'samurai' | 'fantasy' | 'noir' | 'wasteland' | 'race';

const GOLD_THEMES = new Set<Theme>(['vault', 'forge', 'military', 'west', 'pirate', 'fantasy', 'samurai']);

/** Отделка корпуса: делает каждый кейс узнаваемым не только по картинке. */
type Finish = 'hazard' | 'carbon' | 'ornate' | 'painted';
const FINISH: Partial<Record<Theme, Finish>> = {
  ops: 'hazard', military: 'hazard', zombie: 'hazard', wasteland: 'hazard', toxic: 'hazard', race: 'hazard',
  city: 'carbon', cyber: 'carbon', storm: 'carbon', rocket: 'carbon', space: 'carbon', noir: 'carbon', frost: 'carbon',
  vault: 'ornate', forge: 'ornate', fantasy: 'ornate', samurai: 'ornate', pirate: 'ornate', west: 'ornate', crystal: 'ornate',
};

/**
 * Painterly lid scenes generated locally (apps/web/public/cases/scenes/<key>.webp).
 * Hard-coded list of keys that exist — no HEAD/fetch probing. Themes whose key
 * is missing fall back to the vector scene below.
 */
const SCENE_FILES = new Set<string>([
  'anchor', 'biohazard', 'bolt', 'box', 'chip', 'cowboy', 'crown', 'dragon', 'fedora', 'flag', 'flame', 'flower',
  'gasmask', 'gem', 'gift', 'glove', 'heart', 'katana', 'knife', 'leaf', 'medal', 'moon', 'pumpkin', 'rocket',
  'shield', 'skull', 'snowflake', 'star', 'target',
]);

/** Closest painted scene(s) for each internal theme, in order of preference. */
const THEME_SCENE: Record<Theme, string[]> = {
  city: ['chip', 'bolt'], frost: ['snowflake'], flame: ['flame'], jungle: ['leaf'], space: ['star', 'rocket'],
  toxic: ['biohazard'], vault: ['crown'], forge: ['knife'], ocean: ['anchor'], crystal: ['gem'], ops: ['target'],
  storm: ['bolt'], halloween: ['pumpkin'], xmas: ['snowflake', 'moon'], love: ['heart'], spring: ['flower'],
  military: ['medal', 'shield'], party: ['gift'], horror: ['skull'], zombie: ['biohazard'], rocket: ['rocket'],
  cyber: ['chip'], west: ['cowboy'], pirate: ['anchor'], samurai: ['katana'], fantasy: ['dragon'], noir: ['fedora'],
  wasteland: ['gasmask'], race: ['flag'],
};

/** Icons whose own painted scene beats the theme mapping (category-pinned art). */
const ICON_SCENE_FIRST = new Set(['glove', 'shield', 'box']);

function sceneKey(icon: string, theme: Theme): string | null {
  if (ICON_SCENE_FIRST.has(icon) && SCENE_FILES.has(icon)) return icon;
  return THEME_SCENE[theme].find((k) => SCENE_FILES.has(k)) ?? null;
}

/** Icons that pin a dedicated themed scene. */
const ICON_THEMES: Record<string, Theme> = {
  pumpkin: 'halloween', snowflake: 'xmas', heart: 'love', flower: 'spring', medal: 'military', gift: 'party',
  skull: 'horror', biohazard: 'zombie', rocket: 'rocket', chip: 'cyber', cowboy: 'west', anchor: 'pirate',
  katana: 'samurai', dragon: 'fantasy', fedora: 'noir', gasmask: 'wasteland', flag: 'race',
};

type ArtCase = Pick<CaseDTO, 'hue' | 'icon' | 'imageUrl' | 'name'> & {
  cover?: CaseDTO['cover'];
  category?: string;
  slug?: string;
};

const NAME_THEMES: [RegExp, Theme][] = [
  [/неон|кибер|ретро|градиент|neon|cyber|retro/i, 'city'],
  [/аркт|лёд|лед|мороз|frost|arctic|ice/i, 'frost'],
  [/плам|огон|дракон|fire|flame|dragon/i, 'flame'],
  [/камуф|хищ|джунг|camo|jungle/i, 'jungle'],
  [/косм|полноч|доппл|призрак|space|night|ghost/i, 'space'],
  [/ядов|токс|toxic/i, 'toxic'],
  [/джекпот|золот|gold|jackpot/i, 'vault'],
  [/самурай|samurai/i, 'samurai'],
  [/кузн|forge/i, 'forge'],
  [/океан|мор[ея]|ocean|sea/i, 'ocean'],
  [/мрамор|marble/i, 'crystal'],
];

function hueTheme(h: number): Theme {
  if (h < 22 || h >= 335) return 'flame';
  if (h < 58) return 'vault';
  if (h < 100) return 'toxic';
  if (h < 160) return 'jungle';
  if (h < 185) return 'frost';
  if (h < 215) return 'ocean';
  if (h < 250) return 'storm';
  if (h < 290) return 'space';
  return 'city';
}

function themeOf(c: ArtCase, h: number): Theme {
  const byIconTheme = ICON_THEMES[c.icon];
  if (byIconTheme) return byIconTheme;
  for (const [re, t] of NAME_THEMES) if (re.test(c.name)) return t;
  const cat = c.category ?? '';
  const warm = h < 70 || h >= 320;
  if (cat === 'Ножевые' || c.icon === 'knife') return warm ? 'forge' : hueTheme(h);
  if (cat === 'Перчаточные' || c.icon === 'glove') return h >= 190 && h < 300 ? 'storm' : hueTheme(h);
  if (c.icon === 'crown') return 'vault';
  if (cat === 'Премиум' || cat === 'Цвета' || c.icon === 'gem') return 'crystal';
  if (cat === 'Лимитированные' || c.icon === 'moon') return 'city';
  if (cat === 'Оружейные') return hueTheme(h);
  const byIcon: Record<string, Theme> = {
    leaf: 'jungle', shield: 'ops', target: 'ops', bolt: 'storm', star: 'space',
    flame: 'flame',
  };
  return byIcon[c.icon] ?? hueTheme(h);
}

const hsl = (h: number, s: number, l: number, a = 1) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}% / ${a})`;
const pts = (...p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(' ');
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

/** Row of flame tongues along baseY. */
function flames(w: number, baseY: number, height: number, n: number, phase: number) {
  const step = w / n;
  let d = `M0 ${baseY + 20} L0 ${baseY}`;
  for (let i = 0; i < n; i++) {
    const x0 = i * step;
    const hh = height * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7 + phase)));
    d += ` Q${x0 + step * 0.15} ${baseY - hh * 0.5} ${x0 + step * 0.55} ${baseY - hh} Q${x0 + step * 0.5} ${baseY - hh * 0.4} ${x0 + step} ${baseY}`;
  }
  return `${d} L${w} ${baseY + 20} Z`;
}

// ── geometry (viewBox 240×184, ≈1.3:1) ───────────────────────────────────────
// A long box (parallelepiped) in 3/4 view from slightly above: front face,
// top rim with the open cavity, right side face receding along D. The lid is
// hinged at the back edge and opened backwards; its inner face holds the art.
const VB_W = 240;
const VB_H = 184;
// Vector fallback scenes are drawn in a SW×SH local frame.
const SW = 92;
const SH = 67;
const DX = 30; // depth vector
const DY = -18;
const F = { x0: 24, x1: 174, y0: 109, y1: 177 }; // front face (150×68 ≈ 2.2:1)
const BK = { x0: F.x0 + DX, x1: F.x1 + DX, y: F.y0 + DY }; // back top edge (hinge)
const FRONT = pts([F.x0, F.y0], [F.x1, F.y0], [F.x1, F.y1], [F.x0, F.y1]);
const SIDE_R = pts([F.x1, F.y0], [F.x1 + DX, F.y0 + DY], [F.x1 + DX, F.y1 + DY], [F.x1, F.y1]);
// Thin rounded bevel on the left front edge (the left side face itself is hidden).
const SIDE_L = pts([F.x0, F.y0], [F.x0 - 2.5, F.y0 + 2], [F.x0 - 2.5, F.y1 - 2], [F.x0, F.y1]);
const RIM = pts([F.x0, F.y0], [F.x1, F.y0], [BK.x1, BK.y], [BK.x0, BK.y]);
const CAVITY = pts([F.x0 + 7, F.y0 - 2.5], [F.x1 - 5, F.y0 - 2.5], [BK.x1 - 7, BK.y + 2.5], [BK.x0 + 5, BK.y + 2.5]);
const CAV_LWALL = pts([F.x0 + 7, F.y0 - 2.5], [BK.x0 + 5, BK.y + 2.5], [BK.x0 + 5, BK.y + 12], [F.x0 + 7, F.y0 + 7]);
// Lid: trapezoid leaning back, with thickness on its right and top edges.
const LID = { bl: [BK.x0, BK.y], br: [BK.x1, BK.y], tr: [BK.x1 + 8, 6], tl: [BK.x0 + 14, 6] } as const;
const FRAME = pts(LID.bl as [number, number], LID.br as [number, number], LID.tr as [number, number], LID.tl as [number, number]);
const FRAME_SIDE_R = pts(LID.br as [number, number], LID.tr as [number, number], [LID.tr[0] + 5, LID.tr[1] + 3], [LID.br[0] + 5, LID.br[1] + 2]);
const FRAME_TOP = pts(LID.tl as [number, number], LID.tr as [number, number], [LID.tr[0] + 3, LID.tr[1] - 3], [LID.tl[0] + 3, LID.tl[1] - 3]);
const WIN = pts([LID.tl[0] + 7, 13], [LID.tr[0] - 7, 13], [LID.br[0] - 6, BK.y - 6], [LID.bl[0] + 7, BK.y - 6]);
const WX = LID.bl[0] + 7;
const WY = 13;
const WW = LID.tr[0] - 7 - WX;
const WH = BK.y - 6 - WY;
const CX = (F.x0 + F.x1) / 2; // front centre
// Featured skin resting diagonally in the cavity; its lower part sinks behind the front wall.
const SKIN = { cx: 112, cy: 98, w: 196, h: 147 };
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
const SKIN_STYLE = {
  left: pct(SKIN.cx - SKIN.w / 2, VB_W),
  top: pct(SKIN.cy - SKIN.h / 2, VB_H),
  width: pct(SKIN.w, VB_W),
  height: pct(SKIN.h, VB_H),
};
// Carry handle on the side face: two mounts along D, bar hanging out of the face.
const HANDLE_A: [number, number] = [F.x1 + 7, F.y0 + 22];
const HANDLE_B: [number, number] = [F.x1 + DX - 7, F.y0 + 22 + (DY * (DX - 14)) / DX];
const HANDLE = `M${HANDLE_A[0]} ${HANDLE_A[1]} l3 9 L${HANDLE_B[0] + 3} ${HANDLE_B[1] + 9} L${HANDLE_B[0]} ${HANDLE_B[1]}`;
const PLATE = { x: CX - 34, y: 136, w: 68, h: 15 };

export function CaseArt({ c, className = '' }: { c: ArtCase; className?: string }) {
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (s: string) => `ca${rid}-${s}`;
  const url = (s: string) => `url(#${id(s)})`;

  const h = ((Math.round(c.hue) % 360) + 360) % 360;
  const skin = c.cover?.imageUrl ?? null;
  const rarityColor = (c.cover && RARITY_META[c.cover.rarity]?.color) || '#e4ae39';

  // Official CS2 crate: keep the real crate image, add a lit backdrop + ring.
  if (c.imageUrl) {
    return (
      <span className={`case-art cart cart-crate ${className}`} role="img" aria-label={c.name}>
        <span className="cart-stage">
          <svg className="cart-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true">
            <Backdrop h={h} id={id} url={url} />
          </svg>
          <img className="cart-crate-img" src={c.imageUrl} alt="" width={256} height={192} loading="lazy" decoding="async" draggable={false} />
        </span>
      </span>
    );
  }

  const theme = themeOf(c, h);
  // Painting fallback order: per-case art → theme scene → vector scene.
  const own = c.slug && CASE_ART.has(c.slug) ? `/cases/art/${c.slug}.webp` : null;
  const sk = sceneKey(c.icon, theme);
  const paint = own ?? (sk ? `/cases/scenes/${sk}.webp` : null);
  // Backdrop glow: tiny pre-blurred, pre-darkened, alpha-vignetted thumbnail (no runtime filter).
  const blur =
    own && c.slug && CASE_ART_BLUR.has(c.slug) ? `/cases/art-blur/${c.slug}.webp` : sk && SCENE_FILES.has(sk) ? `/cases/scenes-blur/${sk}.webp` : null;
  const gold = GOLD_THEMES.has(theme) || c.icon === 'knife' || c.icon === 'glove' || c.icon === 'crown';
  const finish: Finish = FINISH[theme] ?? 'painted';
  const seed = hashStr(c.slug ?? c.name);
  const variant = seed % 5;
  const latches = 2 + (seed % 3); // 2–4 clasps
  const fx = FX[theme] ?? 'sparks';
  const rim = hsl(h, 100, 62);
  const rimHi = hsl(h, 100, 82);
  const trim = gold ? ['#fff4c2', '#f0bf4c', '#a86e10', '#4f3005'] : ['#ffffff', '#c8d0de', '#6f7a8e', '#262c38'];
  const vk = Math.max(WW / SW, WH / SH); // vector fallback scale (slice-like)
  // Square paintings: biased crop that keeps the upper-middle (faces, horizons).
  const imgY = WY - (WW - WH) * 0.35;
  const latchXs = Array.from({ length: latches }, (_, i) => F.x0 + 18 + (i * (F.x1 - F.x0 - 36)) / (latches - 1));

  return (
    <span
      className={`case-art cart cart-${theme} ${paint ? 'has-paint' : 'no-paint'} ${skin ? 'has-skin' : 'no-skin'} ${className}`}
      role="img"
      aria-label={c.name}
      style={{ ['--hue' as string]: h, ['--rar' as string]: rarityColor }}
    >
      <span className="cart-stage">
      {blur && <img className="cart-bgimg" src={blur} alt="" width={48} height={48} loading="lazy" decoding="async" draggable={false} />}
      <svg className="cart-svg cart-back" viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true">
        <defs>
          <linearGradient id={id('frame')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={hsl(h, 45, 60)} />
            <stop offset=".3" stopColor={hsl(h, 50, 30)} />
            <stop offset=".7" stopColor={hsl(h, 55, 15)} />
            <stop offset="1" stopColor={hsl(h, 45, 36)} />
          </linearGradient>
          <linearGradient id={id('rim')} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={hsl(h, 60, 62)} />
            <stop offset="1" stopColor={hsl(h, 50, 36)} />
          </linearGradient>
          <linearGradient id={id('cav')} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={hsl(h, 60, 6)} />
            <stop offset=".55" stopColor={hsl(h, 85, 30)} />
            <stop offset="1" stopColor={hsl(h, 100, 70)} />
          </linearGradient>
          <linearGradient id={id('trim')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={trim[0]} />
            <stop offset=".35" stopColor={trim[1]} />
            <stop offset=".7" stopColor={trim[2]} />
            <stop offset="1" stopColor={trim[3]} />
          </linearGradient>
          <linearGradient id={id('glass')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".24" />
            <stop offset=".34" stopColor="#fff" stopOpacity=".05" />
            <stop offset=".35" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".18" />
          </linearGradient>
          <linearGradient id={id('inner')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".5" />
            <stop offset=".12" stopColor="#000" stopOpacity="0" />
            <stop offset=".75" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor={hsl(h, 100, 55)} stopOpacity=".35" />
          </linearGradient>
          <radialGradient id={id('vig')} cx=".5" cy=".45" r=".75">
            <stop offset=".6" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor={hsl(h, 60, 6)} stopOpacity=".6" />
          </radialGradient>
          <linearGradient id={id('sheen')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".28" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={id('rar')}>
            <stop offset="0" stopColor={rarityColor} stopOpacity=".8" />
            <stop offset="1" stopColor={rarityColor} stopOpacity="0" />
          </radialGradient>
          <clipPath id={id('win')}>
            <polygon points={WIN} />
          </clipPath>
          <clipPath id={id('front')}>
            <polygon points={FRONT} />
          </clipPath>
          <clipPath id={id('sidec')}>
            <polygon points={SIDE_R} />
          </clipPath>
          {/* vivid, glossy body in the case colours */}
          <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h, 90, 62)} />
            <stop offset=".45" stopColor={hsl(h, 85, 40)} />
            <stop offset="1" stopColor={hsl(h, 85, 18)} />
          </linearGradient>
          <linearGradient id={id('side')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={hsl(h, 75, 26)} />
            <stop offset="1" stopColor={hsl(h, 70, 12)} />
          </linearGradient>
          <linearGradient id={id('tint')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".22" />
            <stop offset=".18" stopColor={hsl(h, 90, 60)} stopOpacity=".08" />
            <stop offset=".7" stopColor={hsl(h, 80, 20)} stopOpacity=".35" />
            <stop offset="1" stopColor={hsl(h, 70, 6)} stopOpacity=".75" />
          </linearGradient>
          <linearGradient id={id('plate')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h, 30, 26)} />
            <stop offset="1" stopColor={hsl(h, 40, 8)} />
          </linearGradient>
          <pattern id={id('hazard')} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#0b0b0d" />
            <rect width="4" height="8" fill={hsl(h, 95, 55)} />
          </pattern>
          <pattern id={id('carbon')} width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="#0d0f14" />
            <rect width="2" height="2" fill="#1d212b" />
            <rect x="2" y="2" width="2" height="2" fill="#1d212b" />
          </pattern>
        </defs>

        <Backdrop h={h} id={id} url={url} />

        {/* ── lid (opened backwards) with the painting ── */}
        <g className="cart-lid">
          <polygon points={FRAME} fill="#000" opacity=".4" transform="translate(4 3)" />
          <polygon points={FRAME_SIDE_R} fill={url('side')} stroke={rim} strokeOpacity=".6" strokeWidth=".6" />
          <polygon points={FRAME_TOP} fill={hsl(h, 40, 58)} />
          <polygon points={FRAME} fill={url('frame')} />
          <polygon points={FRAME} fill="none" stroke={rim} strokeOpacity=".4" strokeWidth="4" strokeLinejoin="round" />
          <polygon points={FRAME} fill="none" stroke={rimHi} strokeWidth="1.1" strokeLinejoin="round" />
          <g clipPath={url('win')}>
            {paint ? (
              <g className={`cart-paint ${own ? 'is-own' : 'is-theme'}`}>
                <image href={paint} x={WX} y={imgY} width={WW} height={WW} preserveAspectRatio="xMidYMid slice" />
                {/* colour grade toward the case hue + vignette */}
                <rect className="cart-grade" x={WX} y={WY} width={WW} height={WH} fill={hsl(h, 100, 50)} />
                <rect x={WX} y={WY} width={WW} height={WH} fill={url('vig')} />
              </g>
            ) : (
              <g transform={`translate(${WX + (WW - SW * vk) / 2} ${WY + (WH - SH * vk) / 2}) scale(${vk})`}>
                <Scene theme={theme} h={h} id={id} url={url} />
              </g>
            )}
            <rect x={WX} y={WY} width={WW} height={WH} fill={url('inner')} />
            <polygon points={WIN} fill={url('glass')} />
          </g>
          <polygon points={WIN} fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="2" />
          <polygon points={WIN} fill="none" stroke={url('trim')} strokeWidth=".9" />
          <line x1={LID.tl[0]} y1={LID.tl[1] + 0.4} x2={LID.tr[0]} y2={LID.tr[1] + 0.4} stroke="#fff" strokeOpacity=".7" strokeWidth=".8" />
          {/* lid corner protectors */}
          {[
            [LID.tl[0], LID.tl[1], 1, 1],
            [LID.tr[0], LID.tr[1], -1, 1],
          ].map(([x, y, sx, sy]) => (
            <path key={x} d={`M${x} ${y} h${sx * 11} v${sy * 3} h${-sx * 8} v${sy * 8} h${-sx * 3} Z`} fill={url('trim')} />
          ))}
          {[
            [LID.tl[0] + 3.5, 9.5],
            [LID.tr[0] - 3.5, 9.5],
            [LID.bl[0] + 3.5, BK.y - 3],
            [LID.br[0] - 3, BK.y - 3],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill={url('trim')} stroke="#000" strokeOpacity=".5" strokeWidth=".4" />
          ))}
        </g>

        {/* ── box: top rim + open cavity ── */}
        <polygon points={RIM} fill={url('rim')} />
        <polygon points={CAVITY} fill={url('cav')} />
        <polygon points={CAV_LWALL} fill="#000" opacity=".35" />
        <polygon points={CAVITY} fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="1.1" />
        <line x1={BK.x0} y1={BK.y} x2={BK.x1} y2={BK.y} stroke={rimHi} strokeOpacity=".7" strokeWidth=".8" />
        <line x1={F.x0} y1={F.y0} x2={BK.x0} y2={BK.y} stroke="#fff" strokeOpacity=".75" strokeWidth=".9" />

        {skin && <ellipse className="cart-rarity" cx={CX + 12} cy={F.y0 - 6} rx="96" ry="22" fill={url('rar')} />}

      </svg>

      {/* featured skin: compositable HTML layer between the back SVG (lid, rim, cavity) and the
          front SVG (side, front wall, rim teeth, clasps, plate), so the box overlaps its lower part */}
      {skin && (
        <span className="cart-skin-wrap" style={SKIN_STYLE}>
          <span className="cart-skin-glow" />
          <img className="cart-skin" src={skin} alt="" width={196} height={147} loading="lazy" decoding="async" draggable={false} />
          <img className="cart-skin cart-skin-tint" src={skin} alt="" width={196} height={147} loading="lazy" decoding="async" draggable={false} aria-hidden />
        </span>
      )}

      <svg className="cart-svg cart-front" viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true">
        {/* right side face */}
        <polygon points={SIDE_R} fill={url('side')} />
        <g clipPath={url('sidec')}>
          {paint && finish === 'painted' && (
            <image href={paint} x={F.x1} y={F.y0 + DY} width={DX} height={F.y1 - F.y0 - DY} preserveAspectRatio="xMidYMid slice" opacity=".35" />
          )}
          <polygon points={SIDE_R} fill="#000" opacity=".35" />
          <line x1={F.x1 + 3} y1={F.y0 + 6} x2={F.x1 + DX - 3} y2={F.y0 + DY + 6} stroke="#000" strokeOpacity=".35" strokeWidth="1.2" />
          <line x1={F.x1 + 3} y1={F.y1 - 8} x2={F.x1 + DX - 3} y2={F.y1 + DY - 8} stroke="#000" strokeOpacity=".35" strokeWidth="1.2" />
        </g>
        <polygon points={SIDE_L} fill={hsl(h, 80, 22)} />

        {/* front face: vivid painted body */}
        <polygon points={FRONT} fill={url('body')} />
        <g clipPath={url('front')}>
          {paint && finish === 'painted' && (
            <image href={paint} x={F.x0} y={F.y0 - 40} width={F.x1 - F.x0} height={F.x1 - F.x0} preserveAspectRatio="xMidYMid slice" opacity=".6" />
          )}
          {finish === 'hazard' && (
            <>
              <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height="7" fill={url('hazard')} />
              <rect x={F.x0} y={F.y1 - 7} width={F.x1 - F.x0} height="7" fill={url('hazard')} />
            </>
          )}
          {finish === 'carbon' && <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height={F.y1 - F.y0} fill={url('carbon')} opacity=".85" />}
          {finish === 'ornate' && (
            <path
              d={`M${F.x0 + 6} ${F.y1 - 9} ${Array.from({ length: 9 }, () => 'q8 -10 16 0').join(' ')}`}
              fill="none"
              stroke={url('trim')}
              strokeWidth="1.2"
              opacity=".85"
            />
          )}
          <rect x={F.x0} y={F.y0} width={F.x1 - F.x0} height={F.y1 - F.y0} fill={url('tint')} />
          {/* panel seams / stripes */}
          <g stroke="#000" strokeOpacity=".4" strokeWidth="1.2">
            <line x1={F.x0} y1={F.y0 + 16} x2={F.x1} y2={F.y0 + 16} />
            <line x1={F.x0} y1={F.y1 - 12} x2={F.x1} y2={F.y1 - 12} />
          </g>
          <g stroke="#fff" strokeOpacity=".22" strokeWidth=".7">
            <line x1={F.x0} y1={F.y0 + 17.2} x2={F.x1} y2={F.y0 + 17.2} />
            <line x1={F.x0} y1={F.y1 - 10.8} x2={F.x1} y2={F.y1 - 10.8} />
          </g>
          <rect x={F.x0} y={F.y1 - 11} width={F.x1 - F.x0} height="3" fill={rim} opacity=".35" />
          <polygon points={pts([F.x0 + 10, F.y1], [F.x0 + 34, F.y0], [F.x0 + 62, F.y0], [F.x0 + 38, F.y1])} fill={url('sheen')} />
        </g>
        {/* jagged rim teeth in the case colour */}
        <g fill={rim} opacity=".9">
          {Array.from({ length: 18 }, (_, i) => {
            const x = F.x0 + 3 + i * 8;
            return <polygon key={x} points={pts([x, F.y0], [x + 4, F.y0 + 4.5], [x + 8, F.y0])} />;
          })}
        </g>

        {/* edge highlights + rim glow */}
        <g fill="none" strokeLinejoin="round" strokeLinecap="round">
          <polygon points={FRONT} stroke={rim} strokeOpacity=".35" strokeWidth="4" />
          <polyline points={pts([F.x0, F.y0], [F.x1, F.y0], [F.x1 + DX, F.y0 + DY])} stroke="#fff" strokeOpacity=".85" strokeWidth="1.1" />
          <polyline points={pts([F.x1, F.y0], [F.x1, F.y1])} stroke={rimHi} strokeWidth="1.1" />
          <polyline points={pts([F.x1 + DX, F.y0 + DY], [F.x1 + DX, F.y1 + DY], [F.x1, F.y1], [F.x0, F.y1], [F.x0, F.y0])} stroke={rimHi} strokeOpacity=".75" strokeWidth=".9" />
        </g>

        {/* name plate (raised) */}
        <g className="cart-plate">
          <rect x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} rx="2" fill="#000" opacity=".55" transform="translate(1 1.6)" />
          <rect x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} rx="2" fill={url('plate')} stroke={url('trim')} strokeWidth="1.1" />
          <line x1={PLATE.x + 2} y1={PLATE.y + 1.2} x2={PLATE.x + PLATE.w - 2} y2={PLATE.y + 1.2} stroke="#fff" strokeOpacity=".35" strokeWidth=".6" />
          {[PLATE.x + 3, PLATE.x + PLATE.w - 3].map((x) => (
            <circle key={x} cx={x} cy={PLATE.y + PLATE.h / 2} r="1.1" fill={url('trim')} />
          ))}
          <text
            x={CX}
            y={PLATE.y + PLATE.h / 2 + 2.7}
            textAnchor="middle"
            fontFamily="Oswald, Impact, sans-serif"
            fontWeight="700"
            fontSize={c.name.length > 14 ? 5.4 : 7.6}
            letterSpacing=".4"
            fill="#fff"
            stroke="#000"
            strokeWidth=".7"
            paintOrder="stroke"
          >
            {c.name.toUpperCase().slice(0, 22)}
          </text>
        </g>

        {/* latches / clasps hanging from the rim */}
        <g className="cart-latches">
          {latchXs.map((x) => (
            <g key={x} transform={`translate(${x} ${F.y0})`}>
              <path d="M-7 -1.5 h14 v6 h-3 l-1.5 11 h-5 l-1.5 -11 h-3 Z" fill="#000" opacity=".5" transform="translate(.8 1.6)" />
              <rect x="-7" y="-1.5" width="14" height="6" rx="1.2" fill={url('trim')} stroke="#000" strokeOpacity=".55" strokeWidth=".5" />
              <path d="M-4 4.5 h8 l-1.5 11 h-5 Z" fill={url('trim')} stroke="#000" strokeOpacity=".55" strokeWidth=".5" />
              <rect x="-1.4" y="8" width="2.8" height="4" rx="1.2" fill="#000" opacity=".6" />
              <line x1="-6" y1="-.6" x2="6" y2="-.6" stroke="#fff" strokeOpacity=".75" strokeWidth=".6" />
              <circle cx="-4.6" cy="1.6" r=".8" fill="#000" opacity=".5" />
              <circle cx="4.6" cy="1.6" r=".8" fill="#000" opacity=".5" />
            </g>
          ))}
        </g>

        {/* rivets/bolts along the bottom band */}
        {Array.from({ length: 9 }, (_, i) => F.x0 + 12 + i * 15.75).map((x) => (
          <g key={x}>
            <circle cx={x} cy={F.y1 - 5.5} r="1.4" fill={url('trim')} />
            <circle cx={x - 0.4} cy={F.y1 - 5.9} r=".45" fill="#fff" opacity=".85" />
          </g>
        ))}

        {/* corner protectors on all visible corners */}
        <g fill={url('trim')} stroke="#000" strokeOpacity=".45" strokeWidth=".5">
          <path d={`M${F.x0 - 2.5} ${F.y0 - 1} h13 v4 h-9 v9 h-4 Z`} />
          <path d={`M${F.x0 - 2.5} ${F.y1 + 1} h13 v-4 h-9 v-9 h-4 Z`} />
          <path d={`M${F.x1 + 1} ${F.y0 - 1} h-13 v4 h9 v9 h4 Z`} />
          <path d={`M${F.x1 + 1} ${F.y1 + 1} h-13 v-4 h9 v-9 h4 Z`} />
          <path d={`M${F.x1 + DX + 1} ${F.y0 + DY - 1} l-9 5.4 v4 l5 -3 v8 h4 Z`} />
          <path d={`M${F.x1 + DX + 1} ${F.y1 + DY + 1} l-9 5.4 v-4 l5 -3 v-8 h4 Z`} />
          <path d={`M${BK.x0 - 1} ${BK.y - 1} h11 l-2 3.4 h-6 l-3.5 2 Z`} />
        </g>
        {/* feet */}
        <rect x={F.x0 + 6} y={F.y1 + 1} width="14" height="4" rx="1.4" fill={url('trim')} />
        <rect x={F.x1 - 20} y={F.y1 + 1} width="14" height="4" rx="1.4" fill={url('trim')} />
        <rect x={F.x1 + DX - 10} y={F.y1 + DY + 1} width="9" height="3.4" rx="1.2" fill={url('trim')} opacity=".85" />

        {/* carry handle on the side face */}
        <g className="cart-handle" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {[HANDLE_A, HANDLE_B].map(([x, y]) => (
            <rect key={x} x={x - 2.5} y={y - 3} width="5" height="6" rx="1" fill={url('trim')} stroke="#000" strokeOpacity=".5" strokeWidth=".5" />
          ))}
          <path d={HANDLE} stroke="#000" strokeOpacity=".55" strokeWidth="4.4" />
          <path d={HANDLE} stroke={url('trim')} strokeWidth="2.6" />
          <path d={HANDLE} stroke="#fff" strokeOpacity=".5" strokeWidth=".6" transform="translate(-.5 -.6)" />
        </g>

        {/* emblem crest on top of the lid */}
        <g className="cart-emblem" transform={`translate(${(LID.tl[0] + LID.tr[0]) / 2} 5)`}>
          <circle r="9.5" fill={rim} opacity=".35" />
          <circle r="7.8" fill={url('trim')} stroke="#000" strokeOpacity=".5" strokeWidth=".5" />
          <circle r="5.9" fill={hsl(h, 70, 16)} stroke="#000" strokeOpacity=".5" strokeWidth=".5" />
          <path
            d={ICONS[c.icon] ?? ICONS.star}
            transform="scale(.17) translate(-50 -52)"
            fill={gold ? '#ffd76a' : rimHi}
            stroke={gold ? '#fff2c0' : '#fff'}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <ellipse cx="-2" cy="-3.4" rx="3.6" ry="1.4" fill="#fff" opacity=".35" transform="rotate(-25 -2 -3.4)" />
        </g>

        <Details variant={variant} h={h} url={url} rim={rim} rimHi={rimHi} />
        <g className="cart-props">
          <Props theme={theme} h={h} />
        </g>
      </svg>
      <span className={`cart-fx cart-fx-${fx}`} style={{ ['--fx' as string]: hsl(h, 100, 70) }} aria-hidden>
        {Array.from({ length: 7 }, (_, i) => (
          <i key={i} style={{ left: `${12 + ((i * 37 + variant * 11) % 76)}%`, animationDelay: `${(i * 0.53 + variant * 0.31) % 3}s` }} />
        ))}
      </span>
      </span>
    </span>
  );
}

const hashStr = (str: string) => [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

type Fx = 'embers' | 'snow' | 'bubbles' | 'sparks' | 'petals';
const FX: Partial<Record<Theme, Fx>> = {
  flame: 'embers', forge: 'embers', halloween: 'embers', horror: 'embers', wasteland: 'embers', fantasy: 'embers',
  frost: 'snow', xmas: 'snow',
  toxic: 'bubbles', zombie: 'bubbles', ocean: 'bubbles', pirate: 'bubbles',
  love: 'petals', spring: 'petals', samurai: 'petals', party: 'petals',
};

/** Per-case extra details, chosen from the slug hash. */
function Details({ variant, h, url, rim, rimHi }: { variant: number; h: number; url: (s: string) => string; rim: string; rimHi: string }) {
  switch (variant) {
    case 0: // cables spilling out of the cavity over the front
      return (
        <g className="cart-details" fill="none" strokeLinecap="round">
          <path d={`M${F.x0 + 22} ${F.y0 - 4} q-14 4 -26 34`} stroke="#000" strokeOpacity=".7" strokeWidth="3.2" />
          <path d={`M${F.x0 + 22} ${F.y0 - 4} q-14 4 -26 34`} stroke={rim} strokeWidth="1.6" />
          <path d={`M${F.x1 - 8} ${F.y0 - 6} q20 2 24 30`} stroke="#000" strokeOpacity=".7" strokeWidth="3.2" />
          <path d={`M${F.x1 - 8} ${F.y0 - 6} q20 2 24 30`} stroke={hsl(h + 140, 100, 62)} strokeWidth="1.6" />
        </g>
      );
    case 1: // spikes on the lid and box corners
      return (
        <g className="cart-details" fill={url('trim')} stroke="#000" strokeOpacity=".5" strokeWidth=".5">
          {[
            [LID.tl[0], LID.tl[1], -1, -1],
            [LID.tr[0], LID.tr[1], 1, -1],
            [F.x0, F.y0, -1, 0],
            [F.x1 + DX, F.y0 + DY, 1, 0],
            [F.x0, F.y1, -1, 1],
            [F.x1 + DX, F.y1 + DY, 1, 1],
          ].map(([x, y, dx, dy]) => (
            <polygon key={`${x}${y}`} points={pts([x - 3, y], [x + 3, y], [x + dx * 7, y + (dy || -0.2) * 8])} />
          ))}
        </g>
      );
    case 2: // antenna with a blinking LED on the lid
      return (
        <g className="cart-details" fill="none" strokeLinecap="round">
          <line x1={LID.tr[0] - 12} y1={LID.tr[1]} x2={LID.tr[0] - 4} y2={LID.tr[1] - 16} stroke="#1a1d24" strokeWidth="2.2" />
          <circle className="cart-led" cx={LID.tr[0] - 4} cy={LID.tr[1] - 16} r="2.4" fill={rimHi} />
        </g>
      );
    case 3: // stickers on the lid frame
      return (
        <g className="cart-details">
          {[
            [LID.tl[0] - 4, 24, h + 180],
            [LID.br[0] + 2, BK.y - 18, h + 60],
          ].map(([x, y, hh]) => (
            <g key={x} transform={`translate(${x} ${y}) rotate(${x < 100 ? -14 : 12})`}>
              <circle r="8" fill={hsl(hh, 90, 55)} stroke="#fff" strokeWidth="1.4" />
              <polygon points={star5(0, 0, 5, 2.2)} fill="#fff" />
            </g>
          ))}
        </g>
      );
    default: // chain draped across the front
      return (
        <g className="cart-details" fill="none" stroke={url('trim')} strokeWidth="1.3">
          {Array.from({ length: 16 }, (_, i) => {
            const x = F.x0 + 4 + i * 9.4;
            const y = F.y0 + 20 + Math.sin((i / 15) * Math.PI) * 9;
            return <ellipse key={i} cx={x} cy={y} rx="4" ry="2.2" transform={`rotate(${i % 2 ? 0 : 90} ${x} ${y})`} />;
          })}
        </g>
      );
  }
}

/** Hue glow, glowing elliptical ring + arc segments, ground shadow. */
function Backdrop({ h, id, url }: { h: number; id: (s: string) => string; url: (s: string) => string }) {
  return (
    <g className="cart-backdrop">
      <defs>
        <radialGradient id={id('glow')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={hsl(h, 100, 62)} stopOpacity=".75" />
          <stop offset=".5" stopColor={hsl(h, 100, 55)} stopOpacity=".25" />
          <stop offset="1" stopColor={hsl(h, 100, 50)} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('floor')}>
          <stop offset="0" stopColor="#000" stopOpacity=".8" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('pool')}>
          <stop offset="0" stopColor={hsl(h, 100, 62)} stopOpacity=".5" />
          <stop offset="1" stopColor={hsl(h, 100, 60)} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="96" rx="132" ry="100" fill={url('glow')} />
      <g className="cart-ring" fill="none">
        <ellipse cx="128" cy="62" rx="104" ry="64" stroke={hsl(h, 100, 60)} strokeOpacity=".25" strokeWidth="7" />
        <ellipse cx="128" cy="62" rx="104" ry="64" stroke={hsl(h, 100, 72)} strokeWidth="1.6" />
        <ellipse className="cart-ring-dash" cx="128" cy="62" rx="112" ry="71" stroke={hsl(h, 100, 70)} strokeOpacity=".75" strokeWidth="2.2" strokeDasharray="44 22 7 22" strokeLinecap="round" />
      </g>
      <ellipse cx="114" cy="178" rx="118" ry="13" fill={url('pool')} />
      <ellipse cx="112" cy="178" rx="98" ry="7" fill={url('floor')} />
    </g>
  );
}

type SceneProps = { theme: Theme; h: number; id: (s: string) => string; url: (s: string) => string };

/** Themed illustration on the inner face of the lid, in a SW×SH local frame. */
function Scene({ theme, h, id, url }: SceneProps) {
  const sky = (top: string, bottom: string) => (
    <>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x="-2" y="-2" width={SW + 4} height={SH + 4} fill={url('sky')} />
    </>
  );
  let body: ReactNode = null;
  switch (theme) {
    case 'city': {
      const bld = [
        [0, 30, 10], [9, 38, 8], [16, 24, 9], [24, 34, 7], [30, 18, 10], [39, 30, 8],
        [53, 22, 9], [61, 36, 7], [67, 26, 10], [76, 34, 8], [83, 20, 10],
      ];
      body = (
        <>
          {sky(hsl(h + 250, 70, 10), hsl(h, 95, 52))}
          <circle cx="46" cy="40" r="19" fill={hsl(h + 40, 100, 62)} />
          <circle cx="46" cy="40" r="19" fill={hsl(h + 70, 100, 72)} opacity=".6" />
          {[36, 41, 46, 50, 54].map((y, i) => (
            <rect key={y} x="24" y={y} width="44" height={1 + i * 0.5} fill={hsl(h, 80, 35)} />
          ))}
          {bld.map(([x, y, w]) => (
            <g key={x}>
              <rect x={x} y={y} width={w} height={SH - y} fill={hsl(h + 250, 50, 8)} />
              {[0, 1, 2, 3].map((r) => (
                <rect key={r} x={x + 2} y={y + 3 + r * 6} width="2" height="2" fill={hsl(h + 50, 100, 75)} opacity={(x + r) % 3 ? 0.9 : 0.25} />
              ))}
            </g>
          ))}
          <line x1="0" y1="56" x2={SW} y2="56" stroke={hsl(h, 100, 70)} strokeWidth="1.2" />
          {[10, 30, 46, 62, 82].map((x) => (
            <line key={x} x1="46" y1="56" x2={x * 2 - 46} y2={SH} stroke={hsl(h, 100, 65)} strokeOpacity=".5" strokeWidth=".6" />
          ))}
        </>
      );
      break;
    }
    case 'frost':
      body = (
        <>
          {sky(hsl(h + 20, 70, 14), hsl(h, 70, 62))}
          <circle cx="68" cy="16" r="12" fill="#fff" opacity=".18" />
          <circle cx="68" cy="16" r="7.5" fill="#f2f8ff" />
          <polygon points={pts([-4, 52], [16, 22], [30, 40], [48, 14], [70, 42], [82, 28], [96, 50], [96, 70], [-4, 70])} fill={hsl(h, 45, 42)} />
          <polygon points={pts([16, 22], [22, 30], [18, 29], [12, 30])} fill="#eef6ff" />
          <polygon points={pts([48, 14], [56, 24], [50, 23], [44, 26], [42, 21])} fill="#eef6ff" />
          <polygon points={pts([82, 28], [87, 35], [80, 34])} fill="#eef6ff" />
          <polygon points={pts([-4, 60], [22, 44], [44, 56], [66, 46], [96, 60], [96, 70], [-4, 70])} fill={hsl(h, 40, 86)} />
          {[[8, 10], [24, 6], [36, 18], [84, 8], [58, 34], [10, 36]].map(([x, y]) => (
            <path key={`${x}${y}`} d={sparkle(x, y, 1.6)} fill="#fff" />
          ))}
        </>
      );
      break;
    case 'flame':
      body = (
        <>
          {sky(hsl(h - 10, 80, 8), hsl(h + 10, 100, 40))}
          <path d={flames(SW, 58, 46, 6, 0.3)} fill={hsl(h, 100, 42)} />
          <path d={flames(SW, 62, 34, 7, 1.4)} fill={hsl(h + 22, 100, 55)} />
          <path d={flames(SW, 66, 20, 8, 2.1)} fill={hsl(52, 100, 74)} />
          {[[12, 14], [30, 8], [52, 18], [70, 6], [84, 22], [40, 28]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" fill={hsl(45, 100, 75)} />
          ))}
        </>
      );
      break;
    case 'jungle':
      body = (
        <>
          {sky(hsl(h + 30, 70, 62), hsl(h, 60, 24))}
          <circle cx="58" cy="22" r="14" fill={hsl(55, 100, 85)} opacity=".7" />
          {[
            [-4, 10, 40, 50], [6, 40, 30, 20], [94, 6, 140, 55], [84, 36, 160, 25], [20, 62, 60, 0], [72, 64, 120, 10],
          ].map(([x, y, r, l], i) => (
            <ellipse key={i} cx={x} cy={y} rx="22" ry="7" transform={`rotate(${r} ${x} ${y})`} fill={hsl(h + (i % 2 ? 10 : -10), 60, 14 + l * 0.3)} />
          ))}
          {[18, 34, 66].map((x) => (
            <path key={x} d={`M${x} -2 Q${x + 4} 14 ${x - 1} 26`} stroke={hsl(h, 50, 16)} strokeWidth="1.2" fill="none" />
          ))}
          <polygon points={pts([-4, 70], [-4, 54], [20, 50], [40, 58], [64, 50], [96, 56], [96, 70])} fill={hsl(h, 55, 10)} />
        </>
      );
      break;
    case 'space':
      body = (
        <>
          {sky(hsl(h + 20, 70, 6), hsl(h, 70, 22))}
          <circle cx="26" cy="40" r="26" fill={hsl(h + 50, 100, 60)} opacity=".25" />
          <circle cx="70" cy="22" r="20" fill={hsl(h - 40, 100, 60)} opacity=".22" />
          {[[6, 8], [18, 22], [34, 6], [48, 30], [80, 52], [86, 10], [12, 56], [56, 58], [40, 46]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 0.7 : 1.2} fill="#fff" />
          ))}
          <path d={sparkle(60, 46, 3.5)} fill="#fff" />
          <defs>
            <radialGradient id={id('planet')} cx=".35" cy=".3" r=".8">
              <stop offset="0" stopColor={hsl(h + 30, 100, 80)} />
              <stop offset=".6" stopColor={hsl(h, 80, 45)} />
              <stop offset="1" stopColor={hsl(h, 70, 12)} />
            </radialGradient>
          </defs>
          <ellipse cx="44" cy="30" rx="26" ry="6" fill="none" stroke={hsl(h + 40, 100, 80)} strokeOpacity=".5" strokeWidth="2" transform="rotate(-14 44 30)" />
          <circle cx="44" cy="30" r="14" fill={url('planet')} />
          <path d="M18 34.5 A26 6 -14 0 0 70 22" transform="rotate(-14 44 30) rotate(14 44 30)" fill="none" stroke={hsl(h + 40, 100, 85)} strokeWidth="2" />
        </>
      );
      break;
    case 'toxic':
      body = (
        <>
          {sky(hsl(h, 60, 8), hsl(h, 70, 24))}
          {[14, 40, 70].map((x, i) => (
            <path key={x} d={`M${x - 4} -2 h8 v${8 + i * 4} q0 5 -4 5 q-4 0 -4 -5 Z`} fill={hsl(h, 100, 50)} opacity=".8" />
          ))}
          <path d="M-2 44 Q12 38 24 44 T48 44 T72 44 T96 44 V70 H-2 Z" fill={hsl(h, 100, 45)} />
          <path d="M-2 44 Q12 38 24 44 T48 44 T72 44 T96 44" fill="none" stroke={hsl(h + 10, 100, 78)} strokeWidth="1.5" />
          {[[16, 52, 3], [30, 58, 2], [56, 50, 2.6], [74, 58, 3.4], [44, 60, 1.6]].map(([x, y, r]) => (
            <circle key={x} cx={x} cy={y} r={r} fill="none" stroke={hsl(h + 10, 100, 85)} strokeWidth=".8" />
          ))}
          <g fill={hsl(h, 50, 10)}>
            <rect x="62" y="24" width="14" height="20" rx="2" />
            <rect x="12" y="28" width="12" height="16" rx="2" />
          </g>
          <g fill={hsl(h, 100, 60)} opacity=".8">
            <rect x="62" y="29" width="14" height="1.4" />
            <rect x="62" y="38" width="14" height="1.4" />
            <rect x="12" y="32" width="12" height="1.2" />
          </g>
        </>
      );
      break;
    case 'vault':
      body = (
        <>
          {sky(hsl(h - 10, 60, 8), hsl(h, 80, 30))}
          {[...Array(9)].map((_, i) => (
            <polygon key={i} points={pts([46, 70], [46 + Math.cos((i * 20 + 190) * (Math.PI / 180)) * 90, 70 + Math.sin((i * 20 + 190) * (Math.PI / 180)) * 90], [46 + Math.cos((i * 20 + 198) * (Math.PI / 180)) * 90, 70 + Math.sin((i * 20 + 198) * (Math.PI / 180)) * 90])} fill={hsl(48, 100, 75)} opacity=".14" />
          ))}
          <defs>
            <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff2b0" />
              <stop offset=".5" stopColor="#f0b93a" />
              <stop offset="1" stopColor="#8a5609" />
            </linearGradient>
          </defs>
          {[
            [18, 58], [38, 58], [58, 58], [28, 50], [48, 50], [38, 42],
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <polygon points={pts([x, y], [x + 18, y], [x + 15, y - 8], [x + 3, y - 8])} fill={url('gold')} stroke="#6b4206" strokeWidth=".5" />
              <line x1={x + 4} y1={y - 7} x2={x + 14} y2={y - 7} stroke="#fff" strokeOpacity=".7" strokeWidth=".6" />
            </g>
          ))}
          {[[8, 64], [82, 62], [76, 66]].map(([x, y]) => (
            <ellipse key={x} cx={x} cy={y} rx="6" ry="2.4" fill={url('gold')} stroke="#6b4206" strokeWidth=".5" />
          ))}
          <path d={sparkle(70, 30, 4)} fill="#fff" />
          <path d={sparkle(20, 34, 2.6)} fill="#fff" />
        </>
      );
      break;
    case 'forge':
      body = (
        <>
          {sky(hsl(h, 40, 7), hsl(h + 10, 90, 32))}
          <ellipse cx="46" cy="58" rx="40" ry="16" fill={hsl(h + 20, 100, 55)} opacity=".55" />
          <defs>
            <linearGradient id={id('steel')} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#e8eef8" />
              <stop offset=".5" stopColor="#9aa6ba" />
              <stop offset="1" stopColor="#4a5262" />
            </linearGradient>
          </defs>
          <g transform="rotate(-35 46 30)">
            <polygon points={pts([44, -4], [48, -4], [49, 40], [46, 46], [43, 40])} fill={url('steel')} />
            <rect x="40" y="40" width="12" height="3" fill="#f0bf4c" />
          </g>
          <g transform="rotate(35 46 30)">
            <polygon points={pts([44, -4], [48, -4], [49, 40], [46, 46], [43, 40])} fill={url('steel')} />
            <rect x="40" y="40" width="12" height="3" fill="#f0bf4c" />
          </g>
          <path d="M18 44 H74 Q74 50 64 50 H58 L60 60 H68 V66 H24 V60 H32 L34 50 H28 Q18 50 18 44 Z" fill={hsl(h, 20, 8)} />
          <line x1="18" y1="44" x2="74" y2="44" stroke={hsl(h + 30, 100, 70)} strokeWidth="1" />
          {[[30, 36, 22, 26], [60, 36, 70, 24], [46, 38, 46, 22], [38, 38, 30, 30], [54, 38, 62, 30]].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={hsl(48, 100, 75)} strokeWidth="1" strokeLinecap="round" />
          ))}
        </>
      );
      break;
    case 'ocean':
      body = (
        <>
          {sky(hsl(h + 20, 80, 28), hsl(h - 20, 90, 72))}
          <circle cx="62" cy="26" r="11" fill={hsl(45, 100, 85)} />
          <circle cx="62" cy="26" r="16" fill={hsl(45, 100, 85)} opacity=".25" />
          <path d="M-2 40 Q10 34 22 40 T46 40 T70 40 T96 40 V70 H-2 Z" fill={hsl(h, 70, 50)} />
          <path d="M-2 48 Q12 42 24 48 T48 48 T72 48 T96 48 V70 H-2 Z" fill={hsl(h, 75, 36)} />
          <path d="M-2 57 Q12 51 24 57 T48 57 T72 57 T96 57 V70 H-2 Z" fill={hsl(h, 80, 22)} />
          <path d="M-2 40 Q10 34 22 40 T46 40 T70 40 T96 40" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1" />
          <path d="M-2 48 Q12 42 24 48 T48 48 T72 48 T96 48" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".8" />
          <path d="M12 22 q3 -3 6 0 q3 -3 6 0" fill="none" stroke={hsl(h, 50, 15)} strokeWidth="1" />
        </>
      );
      break;
    case 'crystal': {
      const shards: [number, number, number, number, number][] = [
        [46, 66, 12, 52, 0], [30, 66, 9, 38, -18], [62, 66, 9, 40, 16], [18, 66, 6, 24, -30], [76, 66, 6, 26, 28],
      ];
      body = (
        <>
          {sky(hsl(h, 60, 8), hsl(h, 70, 30))}
          <circle cx="46" cy="36" r="30" fill={hsl(h, 100, 65)} opacity=".25" />
          {shards.map(([x, y, w, hh, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} ${y})`}>
              <polygon points={pts([x - w / 2, y], [x - w / 2, y - hh * 0.75], [x, y - hh], [x, y])} fill={hsl(h, 90, 66)} />
              <polygon points={pts([x + w / 2, y], [x + w / 2, y - hh * 0.75], [x, y - hh], [x, y])} fill={hsl(h, 85, 40)} />
              <line x1={x - w / 4} y1={y - 2} x2={x - w / 4} y2={y - hh * 0.7} stroke="#fff" strokeOpacity=".6" strokeWidth=".7" />
            </g>
          ))}
          <path d={sparkle(52, 18, 3.6)} fill="#fff" />
          <path d={sparkle(22, 30, 2.4)} fill="#fff" />
          <path d={sparkle(76, 32, 2.4)} fill="#fff" />
        </>
      );
      break;
    }
    case 'ops':
      body = (
        <>
          {sky(hsl(h, 45, 8), hsl(h, 55, 24))}
          <g stroke={hsl(h, 90, 65)} strokeOpacity=".22" strokeWidth=".5">
            {[10, 20, 30, 40, 50, 60].map((y) => (
              <line key={`y${y}`} x1="0" y1={y} x2={SW} y2={y} />
            ))}
            {[10, 22, 34, 46, 58, 70, 82].map((x) => (
              <line key={`x${x}`} x1={x} y1="0" x2={x} y2={SH} />
            ))}
          </g>
          <g fill="none" stroke={hsl(h, 100, 68)} strokeOpacity=".7">
            <circle cx="46" cy="32" r="24" strokeWidth=".8" />
            <circle cx="46" cy="32" r="15" strokeWidth=".6" />
            <circle cx="46" cy="32" r="6" strokeWidth=".6" />
            <line x1="46" y1="4" x2="46" y2="60" strokeWidth=".5" />
            <line x1="18" y1="32" x2="74" y2="32" strokeWidth=".5" />
          </g>
          <path d="M46 32 L46 8 A24 24 0 0 1 66.8 20 Z" fill={hsl(h, 100, 65)} opacity=".4" />
          {[[58, 18], [34, 42], [62, 40]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="1.6" fill={hsl(h + 20, 100, 80)} />
          ))}
          <polygon points={pts([-4, 70], [-4, 56], [16, 50], [30, 56], [52, 48], [72, 56], [96, 50], [96, 70])} fill={hsl(h, 40, 7)} />
        </>
      );
      break;
    case 'storm':
      body = (
        <>
          {sky(hsl(h, 50, 10), hsl(h, 60, 34))}
          <g fill={hsl(h, 25, 22)}>
            {[[8, 10, 14], [26, 6, 16], [46, 10, 15], [66, 5, 17], [86, 10, 14]].map(([x, y, r]) => (
              <circle key={x} cx={x} cy={y} r={r} />
            ))}
          </g>
          <g fill={hsl(h, 20, 34)} opacity=".7">
            {[[16, 16, 9], [56, 16, 10], [80, 18, 8]].map(([x, y, r]) => (
              <circle key={x} cx={x} cy={y} r={r} />
            ))}
          </g>
          <path d="M50 20 L40 40 L48 40 L38 64 L60 34 L51 34 L58 20 Z" fill={hsl(h + 10, 100, 70)} opacity=".35" transform="translate(-1 0) scale(1.04)" />
          <path d="M50 20 L40 40 L48 40 L38 64 L60 34 L51 34 L58 20 Z" fill="#f4fbff" />
          <path d="M20 24 L14 36 L19 36 L13 50" fill="none" stroke={hsl(h + 10, 100, 82)} strokeWidth="1.2" />
          <g stroke={hsl(h, 60, 80)} strokeOpacity=".35" strokeWidth=".6">
            {[6, 16, 28, 64, 74, 84].map((x) => (
              <line key={x} x1={x} y1="28" x2={x - 4} y2="64" />
            ))}
          </g>
        </>
      );
      break;
    default:
      body = <ExtraScene theme={theme} h={h} id={id} url={url} sky={sky} />;
  }
  return <g className="cart-scene">{body}</g>;
}

/** Small themed props around the base of the case (left and right). */
function Props({ theme, h }: { theme: Theme; h: number }) {
  const c1 = hsl(h, 100, 62);
  const c2 = hsl(h, 100, 80);
  const one = (x: number, flip: boolean, y: number): ReactNode => {
    // Props stand on the ground beside the box (and stick out past its corners).
    const t = `translate(${x} ${y}) scale(${flip ? -1.45 : 1.45} 1.45)`;
    switch (theme) {
      case 'city':
        return (
          <g transform={t} fill="none" strokeLinecap="round">
            <path d="M-8 -2 L-2 -14 L4 -2" stroke={c1} strokeOpacity=".35" strokeWidth="4" />
            <path d="M-8 -2 L-2 -14 L4 -2" stroke={c2} strokeWidth="1.6" />
            <rect x="4" y="-9" width="6" height="7" rx="1" stroke={hsl(h + 60, 100, 70)} strokeWidth="1.2" />
          </g>
        );
      case 'frost':
        return (
          <g transform={t}>
            <polygon points="-8,0 -5,-16 -2,0" fill="#e8f6ff" />
            <polygon points="-3,0 2,-22 6,0" fill={hsl(h, 70, 80)} />
            <polygon points="5,0 8,-11 11,0" fill="#ffffff" />
            <line x1="1" y1="-18" x2="1" y2="-3" stroke="#fff" strokeWidth=".7" />
          </g>
        );
      case 'flame':
      case 'forge':
        return (
          <g transform={t}>
            <path d="M0 -24 Q10 -12 7 -5 Q5 1 0 1 Q-7 1 -7 -6 Q-7 -12 -2 -15 Q-2 -9 1 -9 Q4 -15 0 -24 Z" fill={hsl(h + 10, 100, 52)} />
            <path d="M0 -12 Q5 -6 3 -2 Q2 1 0 1 Q-3 1 -3 -3 Q-3 -6 0 -12 Z" fill={hsl(50, 100, 75)} />
          </g>
        );
      case 'jungle':
        return (
          <g transform={t}>
            <path d="M0 0 Q-14 -8 -10 -22 Q2 -14 0 0 Z" fill={hsl(h, 60, 30)} />
            <path d="M0 0 Q12 -6 12 -20 Q0 -14 0 0 Z" fill={hsl(h + 10, 55, 42)} />
            <path d="M0 0 L-8 -16 M0 0 L9 -15" stroke={hsl(h, 50, 70)} strokeWidth=".6" />
          </g>
        );
      case 'space':
        return (
          <g transform={t}>
            <circle cx="0" cy="-8" r="7" fill={hsl(h + 40, 80, 55)} />
            <ellipse cx="0" cy="-8" rx="12" ry="3" fill="none" stroke={c2} strokeWidth="1" transform="rotate(-15 0 -8)" />
            <circle cx="-2.5" cy="-10.5" r="2" fill="#fff" opacity=".5" />
            <path d={sparkle(10, -20, 3)} fill="#fff" />
          </g>
        );
      case 'toxic':
        return (
          <g transform={t}>
            <rect x="-7" y="-18" width="14" height="18" rx="2" fill={hsl(h, 40, 22)} stroke="#000" strokeOpacity=".5" strokeWidth=".5" />
            <rect x="-7" y="-13" width="14" height="1.5" fill={hsl(h, 30, 45)} />
            <rect x="-7" y="-6" width="14" height="1.5" fill={hsl(h, 30, 45)} />
            <ellipse cx="0" cy="-18" rx="7" ry="2" fill={hsl(h, 100, 55)} />
            <path d="M5 -17 v6 q0 2 -1.5 2 q-1.5 0 -1.5 -2 v-5 Z" fill={hsl(h, 100, 55)} />
          </g>
        );
      case 'vault':
        return (
          <g transform={t}>
            {[0, 1, 2, 3].map((i) => (
              <ellipse key={i} cx={i % 2 ? 0.8 : 0} cy={-2 - i * 3} rx="7" ry="2.4" fill={i === 3 ? '#ffe28a' : '#e4ae39'} stroke="#7a4c06" strokeWidth=".5" />
            ))}
            <ellipse cx="11" cy="-2" rx="5" ry="1.8" fill="#e4ae39" stroke="#7a4c06" strokeWidth=".5" />
          </g>
        );
      case 'ocean':
        return (
          <g transform={t}>
            <path d="M0 -14 L2 -8 L8 -8 L3 -4 L5 2 L0 -2 L-5 2 L-3 -4 L-8 -8 L-2 -8 Z" fill={hsl(15, 90, 62)} />
            {[[9, -10, 2.4], [12, -18, 1.6], [7, -22, 1.1]].map(([x, y, r]) => (
              <circle key={y} cx={x} cy={y} r={r} fill="none" stroke={c2} strokeWidth=".7" />
            ))}
          </g>
        );
      case 'crystal':
        return (
          <g transform={t}>
            <polygon points="-7,0 -7,-10 -3,-16 1,-10 1,0" fill={hsl(h, 90, 64)} />
            <polygon points="1,0 1,-10 -3,-16 -3,0" fill={hsl(h, 85, 40)} />
            <polygon points="3,0 4,-7 7,-10 10,-6 9,0" fill={hsl(h + 20, 90, 70)} />
          </g>
        );
      case 'ops':
        return (
          <g transform={t}>
            {[-6, 0, 6].map((x, i) => (
              <g key={x} transform={`translate(${x} 0) rotate(${(i - 1) * 8})`}>
                <rect x="-1.8" y="-10" width="3.6" height="10" fill="#c9922c" />
                <path d="M-1.8 -10 Q0 -16 1.8 -10 Z" fill="#b9bcc4" />
                <rect x="-1.8" y="-2" width="3.6" height="1" fill="#7a5a18" />
              </g>
            ))}
          </g>
        );
      case 'storm':
        return (
          <g transform={t}>
            <path d="M2 -22 L-6 -9 L-1 -9 L-5 1 L6 -13 L1 -13 L5 -22 Z" fill={c1} opacity=".4" transform="scale(1.15)" />
            <path d="M2 -22 L-6 -9 L-1 -9 L-5 1 L6 -13 L1 -13 L5 -22 Z" fill="#f4fbff" />
          </g>
        );
      default:
        return (
          <g transform={`translate(${x} ${y}) scale(1.3) translate(${-x} -150)`}>
            <ExtraProp theme={theme} h={h} x={x} right={flip} />
          </g>
        );
    }
  };
  return (
    <>
      {one(12, false, 181)}
      {one(224, true, 166)}
    </>
  );
}

// ── shared little shapes (original, generic) ────────────────────────────────
const HEART = 'M0 7 C-14 -2 -9 -12 0 -5 C9 -12 14 -2 0 7 Z';
const BAT = 'M0 0 Q-3 -3 -7 -2 Q-5 0 -6 2 Q-3 1 -1 3 Q0 2 1 3 Q3 1 6 2 Q5 0 7 -2 Q3 -3 0 0 Z';
const CACTUS =
  'M-2 0 V-20 Q-2 -23 0 -23 Q2 -23 2 -20 V0 Z M-2 -10 H-6 Q-8 -10 -8 -12 V-16 Q-8 -17.5 -6.5 -17.5 Q-5 -17.5 -5 -16 V-13 H-2 Z M2 -8 H5 V-14 Q5 -15.5 6.5 -15.5 Q8 -15.5 8 -14 V-8 Q8 -6 6 -6 H2 Z';
const HAND = 'M-2 0 L-2 -8 L-4 -13 L-3 -13.5 L-1 -9 L-1 -15 L0 -15 L0.4 -9 L1.4 -14.5 L2.4 -14 L1.6 -8.4 L3.6 -12 L4.4 -11.4 L2.4 -6 L2 0 Z';
const DRAGON = 'M-14 2 Q-8 0 -4 1 L-10 -10 Q-2 -6 0 -1 L4 -12 Q8 -4 4 1 Q10 1 14 -2 Q12 2 6 3 Q2 6 -4 4 Q-10 5 -14 2 Z';
const ANCHOR = 'M0 -20 a2.5 2.5 0 1 0 0.1 0 M0 -17 V0 M-5 -13 H5 M-9 -6 Q-8 1 0 1 Q8 1 9 -6';

function star5(cx: number, cy: number, R: number, r: number) {
  const p: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r : R;
    p.push([+(cx + Math.cos(a) * rr).toFixed(2), +(cy + Math.sin(a) * rr).toFixed(2)]);
  }
  return pts(...p);
}

function Pumpkin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="9" ry="7" fill="#e8700f" />
      <ellipse cx="0" cy="0" rx="4.2" ry="7" fill="#ff9a2e" />
      <rect x="-1" y="-10" width="2" height="4" rx=".8" fill="#46651c" />
      <polygon points="-5.5,-1 -2,-1 -3.7,-4.2" fill="#ffe066" />
      <polygon points="2,-1 5.5,-1 3.7,-4.2" fill="#ffe066" />
      <path d="M-5.5 1.5 L-3.5 3.6 L-1.5 2 L0 3.8 L1.5 2 L3.5 3.6 L5.5 1.5 Q3 5.6 0 5.6 Q-3 5.6 -5.5 1.5 Z" fill="#ffe066" />
    </g>
  );
}

function Candle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-16" r="6" fill="#ffb347" opacity=".3" />
      <rect x="-2.5" y="-12" width="5" height="12" rx="1" fill="#efe6d0" />
      <path d="M-2.5 -11 q1 3 2 0 q1 4 2.5 1" fill="none" stroke="#d6c8a8" strokeWidth=".8" />
      <path d="M0 -19 Q2.4 -15 0 -12.6 Q-2.4 -15 0 -19 Z" fill="#ffd25a" />
    </g>
  );
}

function Fir({ x, y, s = 1, lights = true }: { x: number; y: number; s?: number; lights?: boolean }) {
  const cols = ['#ff4d5e', '#ffd25a', '#4dd8ff', '#9dff6a', '#ff8ad8'];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="-1" width="3" height="4" fill="#5a3a1c" />
      <polygon points="-10,0 10,0 0,-11" fill="#1f6b3e" />
      <polygon points="-8,-7 8,-7 0,-17" fill="#24804a" />
      <polygon points="-6,-13 6,-13 0,-22" fill="#2b9656" />
      {lights &&
        [[-4, -3], [3, -5], [-2, -10], [3, -12], [0, -17], [-5, -8]].map(([lx, ly], i) => (
          <circle key={i} cx={lx} cy={ly} r=".9" fill={cols[i % cols.length]} />
        ))}
    </g>
  );
}

function Flower({ x, y, r, color, stem = 14 }: { x: number; y: number; r: number; color: string; stem?: number }) {
  return (
    <g>
      <path d={`M${x} ${y} Q${x + 2} ${y + stem / 2} ${x} ${y + stem}`} stroke="#2f7a3a" strokeWidth="1.2" fill="none" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * r} cy={y + Math.sin((a * Math.PI) / 180) * r} r={r * 0.78} fill={color} />
      ))}
      <circle cx={x} cy={y} r={r * 0.55} fill="#ffd84a" />
    </g>
  );
}

function Balloon({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 7.5 Q-2 12 1 16 Q3 20 0 24" stroke="#fff" strokeOpacity=".6" strokeWidth=".6" fill="none" />
      <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill={color} />
      <polygon points="-1.2,7.6 1.2,7.6 0,6" fill={color} />
      <ellipse cx="-1.8" cy="-2.6" rx="1.4" ry="2.2" fill="#fff" opacity=".45" />
    </g>
  );
}

function GiftBox({ x, y, box, ribbon, s = 1 }: { x: number; y: number; box: string; ribbon: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-8" y="-12" width="16" height="12" rx="1" fill={box} />
      <rect x="-9" y="-15" width="18" height="4" rx="1" fill={box} stroke="#000" strokeOpacity=".2" strokeWidth=".4" />
      <rect x="-1.4" y="-15" width="2.8" height="15" fill={ribbon} />
      <path d="M0 -15 Q-6 -21 -6.5 -16.5 Q-5 -15 0 -15 Q6 -21 6.5 -16.5 Q5 -15 0 -15 Z" fill={ribbon} />
      <rect x="-8" y="-12" width="4" height="12" fill="#fff" opacity=".12" />
    </g>
  );
}

function Lantern({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-9" r="9" fill="#ff5a3c" opacity=".25" />
      <rect x="-3" y="-17" width="6" height="2" fill="#2a1a12" />
      <ellipse cx="0" cy="-9" rx="6" ry="7.5" fill="#e8322b" />
      <ellipse cx="0" cy="-9" rx="2.6" ry="7.5" fill="#ff6a45" />
      <path d="M-6 -11 H6 M-6 -7 H6" stroke="#8a1410" strokeWidth=".6" />
      <rect x="-3" y="-2.4" width="6" height="2" fill="#2a1a12" />
    </g>
  );
}

function Potion({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-7" r="9" fill={color} opacity=".25" />
      <rect x="-1.8" y="-17" width="3.6" height="5" fill="#cfd8e8" opacity=".8" />
      <rect x="-2.4" y="-19" width="4.8" height="2.4" rx=".6" fill="#8a5a2c" />
      <circle cx="0" cy="-6" r="6.5" fill="#cfe0ff" fillOpacity=".35" stroke="#e8f0ff" strokeOpacity=".7" strokeWidth=".6" />
      <path d="M-6.4 -5 A6.5 6.5 0 0 0 6.4 -5 Z" fill={color} />
      <ellipse cx="-2.4" cy="-8.4" rx="1.2" ry="2" fill="#fff" opacity=".6" />
    </g>
  );
}

function Barrel({ x, y, body, band, top, s = 1 }: { x: number; y: number; body: string; band: string; top: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-7" y="-18" width="14" height="18" rx="2" fill={body} stroke="#000" strokeOpacity=".5" strokeWidth=".5" />
      <rect x="-7" y="-13" width="14" height="1.5" fill={band} />
      <rect x="-7" y="-6" width="14" height="1.5" fill={band} />
      <rect x="-5.5" y="-17" width="2.4" height="16" fill="#fff" opacity=".12" />
      <ellipse cx="0" cy="-18" rx="7" ry="2" fill={top} />
    </g>
  );
}

type SkyFn = (top: string, bottom: string) => ReactNode;

/** Scenes for the holiday / film-and-game genre cases. Generic imagery only. */
function ExtraScene({ theme, h, id, url, sky }: { theme: Theme; h: number; id: (s: string) => string; url: (s: string) => string; sky: SkyFn }) {
  switch (theme) {
    case 'halloween':
      return (
        <>
          {sky('hsl(275 60% 10%)', 'hsl(24 100% 46%)')}
          <circle cx="66" cy="18" r="16" fill="#ffd98a" opacity=".22" />
          <circle cx="66" cy="18" r="11" fill="#ffe7a8" />
          <path d="M8 70 L11 44 L15 44 L17 70 Z" fill="hsl(275 50% 7%)" />
          <path d="M13 44 Q8 32 1 29 M13 44 Q17 32 25 25 M12 52 Q6 48 -1 50 M18 34 Q24 33 28 37" stroke="hsl(275 50% 7%)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          {[[40, 14, 1], [52, 26, 0.8], [80, 36, 0.9], [30, 30, 0.6]].map(([x, y, sc]) => (
            <path key={x} d={BAT} transform={`translate(${x} ${y}) scale(${sc})`} fill="hsl(275 50% 7%)" />
          ))}
          <path d="M-2 70 L-2 56 Q30 46 60 54 Q80 58 96 52 L96 70 Z" fill="hsl(275 45% 9%)" />
          <Pumpkin x={34} y={56} s={0.9} />
          <Pumpkin x={60} y={60} s={1.15} />
          <Pumpkin x={80} y={57} s={0.65} />
        </>
      );
    case 'xmas':
      return (
        <>
          {sky('hsl(228 70% 10%)', 'hsl(205 80% 42%)')}
          {[[8, 8], [22, 16], [38, 6], [60, 12], [84, 6], [74, 22], [12, 28], [88, 30]].map(([x, y], i) => (
            <path key={i} d={sparkle(x, y, i % 2 ? 1.4 : 2)} fill="#fff" />
          ))}
          <path d="M-2 70 V50 Q24 40 50 48 Q74 54 96 44 V70 Z" fill="#e9f3ff" />
          <Fir x={18} y={56} s={0.95} />
          <Fir x={76} y={52} s={1.05} />
          <Fir x={46} y={58} s={1.6} />
          <path d={sparkle(46, 22, 3.6)} fill="#ffe27a" />
          <path d="M-2 70 V60 Q30 54 60 60 Q80 63 96 58 V70 Z" fill="#cfe2f8" />
        </>
      );
    case 'love':
      return (
        <>
          {sky('hsl(330 80% 16%)', 'hsl(345 100% 58%)')}
          <defs>
            <linearGradient id={id('heart')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff9ab8" />
              <stop offset="1" stopColor="#e0103f" />
            </linearGradient>
          </defs>
          <path d={HEART} transform="translate(46 34) scale(3)" fill="#ff6b9a" opacity=".3" />
          <path d={HEART} transform="translate(46 34) scale(2.3)" fill={url('heart')} stroke="#ffd0dd" strokeWidth=".5" />
          <ellipse cx="38" cy="26" rx="4" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-30 38 26)" />
          {[[12, 18, 0.5], [80, 14, 0.6], [16, 50, 0.7], [76, 50, 0.5], [64, 8, 0.35], [26, 6, 0.4]].map(([x, y, sc]) => (
            <path key={x} d={HEART} transform={`translate(${x} ${y}) scale(${sc})`} fill="#ffc2d4" />
          ))}
          <path d={sparkle(70, 30, 3)} fill="#fff" />
          <path d={sparkle(22, 34, 2.2)} fill="#fff" />
        </>
      );
    case 'spring':
      return (
        <>
          {sky('hsl(200 80% 74%)', 'hsl(330 75% 84%)')}
          <circle cx="72" cy="14" r="14" fill="#fff6c0" opacity=".4" />
          <circle cx="72" cy="14" r="8" fill="#fff6c0" />
          <path d="M-2 70 V48 Q30 38 60 48 Q80 54 96 46 V70 Z" fill="hsl(125 50% 48%)" />
          <Flower x={18} y={44} r={3.6} color="#ff6fa8" />
          <Flower x={34} y={36} r={4.6} color="#ffb3cf" stem={20} />
          <Flower x={52} y={42} r={4} color="#c78bff" stem={18} />
          <Flower x={70} y={38} r={4.4} color="#ff8a5c" stem={20} />
          <Flower x={84} y={48} r={3.2} color="#fff" />
          <path d="M-2 70 V60 Q30 54 60 60 Q80 64 96 58 V70 Z" fill="hsl(120 55% 32%)" />
        </>
      );
    case 'military':
      return (
        <>
          {sky('hsl(80 25% 16%)', 'hsl(48 45% 52%)')}
          {[...Array(10)].map((_, i) => (
            <polygon key={i} points={pts([46, 30], [46 + Math.cos(i * 0.628) * 80, 30 + Math.sin(i * 0.628) * 80], [46 + Math.cos(i * 0.628 + 0.2) * 80, 30 + Math.sin(i * 0.628 + 0.2) * 80])} fill="#fff4c0" opacity=".1" />
          ))}
          <defs>
            <linearGradient id={id('mstar')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff2b0" />
              <stop offset=".5" stopColor="#f0b93a" />
              <stop offset="1" stopColor="#9a5f08" />
            </linearGradient>
          </defs>
          <polygon points={star5(46, 30, 19, 8)} fill={url('mstar')} stroke="#5e3a06" strokeWidth=".7" />
          <polygon points={star5(46, 30, 11, 4.6)} fill="#d8322b" />
          <path d="M-2 70 V54 Q20 48 40 54 Q64 60 96 50 V70 Z" fill="hsl(85 30% 20%)" />
          <g fill="hsl(85 25% 10%)" transform="translate(64 56)">
            <rect x="-12" y="-4" width="24" height="6" rx="3" />
            <rect x="-8" y="-9" width="12" height="5" rx="1.5" />
            <rect x="3" y="-7.6" width="14" height="1.8" />
          </g>
        </>
      );
    case 'party': {
      const cols = ['#ff4d6d', '#ffd23f', '#3ee0ff', '#8cff5a', '#c77dff', '#ff8a3c'];
      return (
        <>
          {sky('hsl(285 70% 18%)', 'hsl(320 90% 55%)')}
          {[...Array(22)].map((_, i) => (
            <rect key={i} x={(i * 37) % 90} y={(i * 23) % 62} width="2.6" height="1.4" fill={cols[i % cols.length]} transform={`rotate(${i * 40} ${(i * 37) % 90} ${(i * 23) % 62})`} />
          ))}
          <path d="M-2 6 Q12 14 24 6 T48 6 T72 6 T96 6" stroke="#ffd23f" strokeWidth="1.4" fill="none" />
          <path d="M-2 12 Q12 4 24 12 T48 12 T72 12 T96 12" stroke="#3ee0ff" strokeWidth="1.1" fill="none" />
          <Balloon x={22} y={30} color="#ff4d6d" s={1.4} />
          <Balloon x={44} y={24} color="#ffd23f" s={1.7} />
          <Balloon x={66} y={32} color="#3ee0ff" s={1.4} />
          <Balloon x={82} y={22} color="#c77dff" s={1.1} />
          <GiftBox x={46} y={67} box="#7b2cff" ribbon="#ffd23f" s={1.1} />
        </>
      );
    }
    case 'horror':
      return (
        <>
          {sky('hsl(0 70% 5%)', 'hsl(350 75% 26%)')}
          <circle cx="62" cy="22" r="19" fill="hsl(0 90% 50%)" opacity=".22" />
          <circle cx="62" cy="22" r="13" fill="hsl(0 85% 46%)" />
          <circle cx="58" cy="19" r="3" fill="hsl(0 70% 36%)" />
          <path d="M80 70 L82 40 Q86 30 94 28 M82 46 Q76 40 70 42" stroke="#0a0204" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M-2 70 V54 Q30 46 60 52 Q80 56 96 50 V70 Z" fill="#0d0306" />
          {[[16, 52, 7, 9], [34, 50, 6, 8], [56, 52, 7, 10]].map(([x, y, w, hh]) => (
            <path key={x} d={`M${x} ${y} v${-hh + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${hh - w / 2} Z`} fill="#1a0a0e" stroke="#3a1a20" strokeWidth=".5" />
          ))}
          <path d="M70 52 v-12 M66 44 h8" stroke="#1a0a0e" strokeWidth="2" />
          <ellipse cx="30" cy="58" rx="40" ry="4" fill="#fff" opacity=".1" />
          <ellipse cx="70" cy="62" rx="34" ry="3" fill="#fff" opacity=".08" />
          <rect x="-2" y="-2" width={SW + 4} height="3.2" fill="#b0101c" />
          {[[8, 7], [20, 4], [37, 9], [52, 5], [70, 8], [84, 5]].map(([x, len]) => (
            <path key={x} d={`M${x - 1.6} 0 V${len} Q${x - 1.6} ${len + 2.6} ${x} ${len + 2.6} Q${x + 1.6} ${len + 2.6} ${x + 1.6} ${len} V0 Z`} fill="#b0101c" />
          ))}
        </>
      );
    case 'zombie':
      return (
        <>
          {sky('hsl(100 50% 6%)', 'hsl(95 60% 26%)')}
          <circle cx="70" cy="14" r="8" fill="hsl(80 60% 80%)" opacity=".85" />
          <g fill="none" stroke="hsl(90 100% 55%)" strokeWidth="2.2" opacity=".85">
            <circle cx="40" cy="16" r="7" />
            <circle cx="34" cy="26" r="7" />
            <circle cx="46" cy="26" r="7" />
          </g>
          <circle cx="40" cy="22.6" r="2.6" fill="hsl(90 100% 55%)" />
          <polygon points={pts([-2, 70], [-2, 34], [6, 34], [8, 30], [12, 36], [14, 40], [22, 40], [22, 30], [26, 26], [30, 32], [30, 44], [58, 44], [58, 28], [62, 32], [64, 26], [70, 26], [70, 38], [78, 36], [82, 42], [88, 32], [96, 34], [96, 70])} fill="hsl(100 30% 7%)" />
          {[[8, 38], [16, 44], [62, 32], [66, 40], [90, 40]].map(([x, y]) => (
            <rect key={x} x={x} y={y} width="2" height="2" fill="hsl(80 100% 60%)" opacity=".6" />
          ))}
          <rect x="-2" y="50" width={SW + 4} height="10" fill="hsl(95 80% 50%)" opacity=".16" />
          <path d="M-2 70 V60 Q40 56 96 62 V70 Z" fill="hsl(100 40% 5%)" />
          {[[24, 62, 1], [52, 61, -1], [72, 63, 1]].map(([x, y, f]) => (
            <path key={x} d={HAND} transform={`translate(${x} ${y}) scale(${f} 1)`} fill="hsl(90 25% 30%)" />
          ))}
        </>
      );
    case 'rocket':
      return (
        <>
          {sky('hsl(240 70% 6%)', 'hsl(262 70% 26%)')}
          {[[6, 8], [18, 30], [70, 8], [86, 20], [56, 20], [12, 50], [30, 12], [80, 40]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 0.7 : 1.2} fill="#fff" />
          ))}
          <defs>
            <radialGradient id={id('rplanet')} cx=".3" cy=".3" r=".8">
              <stop offset="0" stopColor={hsl(h + 40, 90, 70)} />
              <stop offset="1" stopColor={hsl(h, 70, 18)} />
            </radialGradient>
          </defs>
          <circle cx="86" cy="76" r="34" fill={url('rplanet')} />
          <path d="M8 74 Q22 54 40 36" stroke="#fff" strokeOpacity=".25" strokeWidth="9" fill="none" strokeLinecap="round" />
          {[[12, 64, 5], [18, 56, 4.4], [25, 49, 3.8], [31, 43, 3]].map(([x, y, r]) => (
            <circle key={x} cx={x} cy={y} r={r} fill="#e8ecf5" opacity=".55" />
          ))}
          <g transform="translate(44 30) rotate(42)">
            <path d="M0 10 Q4 18 0 24 Q-4 18 0 10 Z" fill="#ffd25a" />
            <path d="M0 10 Q2 15 0 19 Q-2 15 0 10 Z" fill="#fff" />
            <path d="M-6 6 L-10 12 L-5 11 Z M6 6 L10 12 L5 11 Z" fill="#e8322b" />
            <path d="M0 -14 Q6 -8 6 4 L6 10 L-6 10 L-6 4 Q-6 -8 0 -14 Z" fill="#eef2f8" />
            <path d="M0 -14 Q6 -8 6 4 L6 10 L2 10 L2 4 Q2 -8 0 -14 Z" fill="#a8b2c4" />
            <circle cx="0" cy="-2" r="2.6" fill={hsl(h + 20, 100, 65)} stroke="#4a5262" strokeWidth=".8" />
          </g>
        </>
      );
    case 'cyber': {
      const tr = hsl(185, 100, 60);
      const traces = [
        'M-2 10 H20 L26 16 H34', 'M-2 30 H12 L18 24 H34', 'M-2 50 H16 L22 44 H34', 'M94 12 H70 L64 18 H58',
        'M94 34 H76 L70 28 H58', 'M94 54 H72 L66 48 H58', 'M40 -2 V20', 'M52 -2 V8 L48 12 V20', 'M42 44 V70', 'M50 44 V56 L56 62 H70',
      ];
      return (
        <>
          {sky(hsl(h, 70, 6), hsl(h + 20, 80, 22))}
          <g fill="none" stroke={tr} strokeWidth=".9" opacity=".8">
            {traces.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {[[34, 16], [34, 24], [34, 44], [58, 18], [58, 28], [58, 48], [70, 62], [40, 20]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill={tr} />
          ))}
          <rect x="31" y="17" width="30" height="30" rx="3" fill={hsl(h, 100, 60)} opacity=".25" />
          <rect x="34" y="20" width="24" height="24" rx="2" fill="hsl(230 30% 10%)" stroke={hsl(h, 100, 70)} strokeWidth="1.2" />
          <rect x="40" y="26" width="12" height="12" rx="1" fill={hsl(h, 100, 60)} />
          <rect x="43" y="29" width="6" height="6" fill={hsl(h + 40, 100, 85)} />
        </>
      );
    }
    case 'west':
      return (
        <>
          {sky('hsl(18 80% 38%)', 'hsl(42 100% 66%)')}
          <circle cx="46" cy="46" r="22" fill="#fff1b8" opacity=".3" />
          <circle cx="46" cy="46" r="15" fill="#fff1b8" />
          <path d="M60 14 l3 2 l3 -2 M70 20 l2 1.5 l2 -1.5" stroke="hsl(20 50% 20%)" strokeWidth=".8" fill="none" />
          <polygon points={pts([-2, 70], [-2, 44], [6, 44], [10, 36], [26, 36], [30, 46], [58, 46], [62, 40], [80, 40], [84, 30], [96, 30], [96, 70])} fill="hsl(14 55% 32%)" />
          <path d="M-2 70 V56 Q40 50 96 58 V70 Z" fill="hsl(25 50% 18%)" />
          <path d={CACTUS} transform="translate(18 62) scale(1.1)" fill="hsl(130 30% 14%)" />
          <path d={CACTUS} transform="translate(74 64) scale(-.8 .8)" fill="hsl(130 30% 14%)" />
        </>
      );
    case 'pirate':
      return (
        <>
          {sky('hsl(225 60% 12%)', 'hsl(22 85% 52%)')}
          <circle cx="70" cy="14" r="6" fill="#fff6dc" />
          <circle cx="40" cy="46" r="12" fill="#ffb347" />
          <rect x="-2" y="44" width={SW + 4} height="30" fill="hsl(215 60% 14%)" />
          {[48, 53, 59].map((y, i) => (
            <path key={y} d={`M${-2 + i * 6} ${y} q6 -2 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0`} stroke="#ffd59a" strokeOpacity={0.5 - i * 0.12} strokeWidth=".8" fill="none" />
          ))}
          <g fill="hsl(220 40% 7%)">
            <path d="M22 44 H70 L64 52 H28 Z" />
            <rect x="34" y="12" width="1.4" height="32" />
            <rect x="52" y="8" width="1.4" height="36" />
            <path d="M26 18 Q36 22 34 36 H22 Q26 28 26 18 Z" fill="hsl(30 25% 72%)" />
            <path d="M36 14 Q48 20 44 40 H36 Z" fill="hsl(30 25% 78%)" />
            <path d="M54 10 Q66 18 62 40 H54 Z" fill="hsl(30 25% 78%)" />
            <path d="M53 8 h7 l-2 2 l2 2 h-7 Z" />
          </g>
        </>
      );
    case 'samurai':
      return (
        <>
          {sky('hsl(40 60% 86%)', 'hsl(12 80% 60%)')}
          <circle cx="54" cy="28" r="18" fill="hsl(355 85% 50%)" />
          <polygon points={pts([-2, 70], [22, 40], [40, 26], [56, 38], [96, 62], [96, 70])} fill="hsl(240 18% 28%)" />
          <path d="M33 31 L40 26 L47 31 L44 33 L40 30 L36 33 Z" fill="#f4f1ea" />
          <g fill="hsl(350 30% 12%)" transform="translate(76 66)">
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(0 ${-i * 9})`}>
                <rect x={-5 + i} y="-7" width={10 - i * 2} height="7" />
                <path d={`M${-11 + i * 2} -6 Q0 -10 ${11 - i * 2} -6 L${8 - i * 2} -9 H${-8 + i * 2} Z`} />
              </g>
            ))}
            <rect x="-.5" y="-34" width="1" height="7" />
          </g>
          <path d="M-2 6 Q14 10 24 20 M10 9 Q12 2 18 0" stroke="hsl(15 40% 20%)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {[[6, 6], [14, 10], [20, 16], [24, 22], [12, 2], [18, 4], [28, 18]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2" fill="#ffb6cf" />
          ))}
          {[[36, 48], [50, 56], [30, 60], [62, 50]].map(([x, y]) => (
            <ellipse key={x} cx={x} cy={y} rx="1.4" ry=".8" fill="#ffb6cf" transform={`rotate(30 ${x} ${y})`} />
          ))}
        </>
      );
    case 'fantasy':
      return (
        <>
          {sky('hsl(250 60% 12%)', hsl(h, 60, 42))}
          <circle cx="74" cy="14" r="9" fill="#f2f6ff" />
          <circle cx="74" cy="14" r="14" fill="#f2f6ff" opacity=".2" />
          {[[8, 8], [24, 4], [40, 12], [58, 6], [88, 26]].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r=".8" fill="#fff" />
          ))}
          <path d={DRAGON} transform="translate(62 30) scale(1.2)" fill="hsl(250 40% 8%)" />
          <g fill="hsl(250 40% 9%)">
            <polygon points={pts([-2, 70], [-2, 50], [10, 46], [40, 48], [50, 56], [96, 58], [96, 70])} />
            <rect x="12" y="30" width="7" height="18" />
            <rect x="22" y="36" width="12" height="12" />
            <rect x="36" y="26" width="6" height="22" />
            <polygon points="11,30 15.5,20 20,30" />
            <polygon points="35,26 39,16 43,26" />
            <path d="M22 36 h2 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2 h2 v2" />
          </g>
          <path d="M39 16 v-4 l5 1.5 l-5 1.5" fill={hsl(h, 90, 60)} />
          {[[15, 36], [28, 40], [39, 32]].map(([x, y]) => (
            <rect key={x} x={x} y={y} width="1.6" height="2.4" fill="#ffd25a" />
          ))}
        </>
      );
    case 'noir':
      return (
        <>
          {sky('#0c0e13', hsl(h, 12, 28))}
          {[0, 1, 2, 3, 4].map((i) => (
            <polygon key={i} points={pts([-2, 4 + i * 8], [40, -8 + i * 8], [40, -4 + i * 8], [-2, 8 + i * 8])} fill="#fff" opacity=".06" />
          ))}
          <g fill="#07080b">
            <rect x="-2" y="24" width="18" height="46" />
            <rect x="14" y="34" width="14" height="36" />
            <rect x="30" y="18" width="16" height="52" />
            <rect x="80" y="28" width="16" height="42" />
          </g>
          {[[2, 30], [8, 40], [34, 24], [40, 36], [84, 34]].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x} y={y} width="3" height="2" fill="#ffd77a" opacity=".55" />
          ))}
          <polygon points="64,20 50,64 80,64" fill="#ffe7a0" opacity=".14" />
          <ellipse cx="64" cy="64" rx="14" ry="2.4" fill="#ffe7a0" opacity=".3" />
          <path d="M70 66 V18 Q70 14 66 14 H63" stroke="#14161c" strokeWidth="1.6" fill="none" />
          <path d="M60 18 h6 l-1 -3 h-4 Z" fill="#14161c" />
          <circle cx="63" cy="19" r="1.6" fill="#fff3c0" />
          <g stroke="#cfd6e2" strokeOpacity=".25" strokeWidth=".5">
            {[6, 18, 26, 44, 56, 76, 88].map((x) => (
              <line key={x} x1={x} y1="0" x2={x - 5} y2="66" />
            ))}
          </g>
        </>
      );
    case 'wasteland':
      return (
        <>
          {sky('hsl(38 65% 58%)', 'hsl(20 55% 32%)')}
          <circle cx="28" cy="20" r="10" fill="#fff3d0" opacity=".75" />
          <g fill="hsl(20 30% 16%)">
            <polygon points={pts([4, 66], [4, 34], [10, 30], [12, 36], [16, 32], [18, 66])} />
            <polygon points={pts([36, 66], [36, 26], [44, 22], [46, 30], [50, 26], [50, 66])} />
          </g>
          {[[8, 40], [8, 48], [40, 32], [40, 40], [44, 48]].map(([x, y]) => (
            <rect key={`${x}${y}`} x={x} y={y} width="3" height="3" fill="hsl(35 60% 45%)" />
          ))}
          <g stroke="hsl(20 30% 14%)" strokeWidth="1" fill="none">
            <path d="M66 66 L72 14 L78 66 M68 50 L77 50 M69 36 L76 36 M70 24 L74 24 M66 66 L77 50 M78 66 L68 50 M68 50 L76 36 M77 50 L69 36" />
            <path d="M62 24 H82 M64 24 L62 28 M80 24 L82 28" />
            <path d="M82 26 Q90 32 96 30" strokeOpacity=".7" />
          </g>
          <rect x="-2" y="40" width={SW + 4} height="30" fill="hsl(35 70% 60%)" opacity=".18" />
          <path d="M-2 70 V58 Q24 52 46 58 Q70 64 96 56 V70 Z" fill="hsl(28 45% 24%)" />
        </>
      );
    case 'race':
      return (
        <>
          {sky(hsl(h, 40, 10), hsl(h, 70, 32))}
          {[14, 40, 66, 86].map((x) => (
            <g key={x}>
              <circle cx={x} cy="6" r="6" fill="#fff" opacity=".18" />
              <circle cx={x} cy="6" r="2.4" fill="#fffbe0" />
            </g>
          ))}
          <polygon points={pts([36, 30], [56, 30], [96, 70], [-4, 70])} fill="#23262e" />
          <polygon points={pts([36, 30], [38, 30], [2, 70], [-4, 70])} fill="#fff" opacity=".7" />
          <polygon points={pts([54, 30], [56, 30], [96, 70], [90, 70])} fill="#e8322b" />
          {[0, 1, 2, 3].map((i) => (
            <polygon key={i} points={pts([45.5, 34 + i * 9], [46.5, 34 + i * 9], [47 + i * 0.6, 39 + i * 10], [45 - i * 0.6, 39 + i * 10])} fill="#ffd25a" />
          ))}
          <g stroke="#fff" strokeOpacity=".5" strokeWidth=".7">
            <line x1="-2" y1="38" x2="20" y2="38" />
            <line x1="70" y1="42" x2="96" y2="42" />
            <line x1="76" y1="48" x2="96" y2="48" />
          </g>
          <g transform="translate(8 12) skewY(-8)">
            <rect x="-1.4" y="0" width="1.4" height="26" fill="#cfd6e2" />
            {[0, 1, 2, 3, 4, 5].map((cx) =>
              [0, 1, 2, 3].map((cy) => (
                <rect key={`${cx}${cy}`} x={cx * 4} y={cy * 4} width="4" height="4" fill={(cx + cy) % 2 ? '#111' : '#fff'} />
              )),
            )}
          </g>
        </>
      );
    default:
      return sky(hsl(h, 60, 10), hsl(h, 70, 40));
  }
}

/** Props for the extra themes; `right` = right-hand side of the case. */
function ExtraProp({ theme, h, x, right }: { theme: Theme; h: number; x: number; right: boolean }) {
  const y = 150;
  const t = `translate(${x} ${y})${right ? ' scale(-1 1)' : ''}`;
  switch (theme) {
    case 'halloween':
      return right ? <Candle x={x} y={y} s={1.1} /> : <Pumpkin x={x} y={y - 7} s={1} />;
    case 'xmas':
      return right ? (
        <g transform={`translate(${x} ${y - 9})`}>
          <circle r="8" fill={hsl(h + 150, 80, 50)} />
          <ellipse cx="-2.6" cy="-3" rx="2.4" ry="1.6" fill="#fff" opacity=".55" />
          <rect x="-2.4" y="-10.6" width="4.8" height="3" fill="#d8c27a" />
        </g>
      ) : (
        <GiftBox x={x} y={y} box="#d8322b" ribbon="#ffd25a" />
      );
    case 'love':
      return (
        <g transform={t}>
          <path d={HEART} transform="translate(0 -9) scale(1.1)" fill="#ff4d7d" />
          <path d={HEART} transform="translate(9 -18) scale(.55)" fill="#ffc2d4" />
        </g>
      );
    case 'spring':
      return (
        <g transform={t}>
          {[[-4, -14, '#ff5a8a'], [3, -18, '#ffb3cf'], [8, -11, '#ff8a5c']].map(([fx, fy, col]) => (
            <g key={fx}>
              <path d={`M${fx} 0 V${fy}`} stroke="#2f7a3a" strokeWidth="1.2" />
              <path d={`M${+fx - 3} ${+fy + 1} Q${+fx - 3} ${+fy - 5} ${fx} ${+fy - 4} Q${+fx + 3} ${+fy - 5} ${+fx + 3} ${+fy + 1} Q${fx} ${+fy + 3} ${+fx - 3} ${+fy + 1} Z`} fill={col as string} />
            </g>
          ))}
        </g>
      );
    case 'military':
      return right ? (
        <g transform={t}>
          {[-5, 0, 5].map((bx) => (
            <g key={bx} transform={`translate(${bx} 0)`}>
              <rect x="-1.8" y="-10" width="3.6" height="10" fill="#c9922c" />
              <path d="M-1.8 -10 Q0 -16 1.8 -10 Z" fill="#b9bcc4" />
            </g>
          ))}
        </g>
      ) : (
        <g transform={`translate(${x} ${y})`}>
          <path d="M-5 -22 L-2 -12 H2 L5 -22 Z" fill="#d8322b" />
          <path d="M-1.5 -22 L0 -12 L1.5 -22 Z" fill="#fff" opacity=".7" />
          <circle cx="0" cy="-7" r="6" fill="#e4ae39" stroke="#7a4c06" strokeWidth=".6" />
          <polygon points={star5(0, -7, 4, 1.7)} fill="#fff2b0" />
        </g>
      );
    case 'party':
      return right ? (
        <g>
          <Balloon x={x - 3} y={y - 22} color="#ffd23f" />
          <Balloon x={x + 4} y={y - 18} color="#3ee0ff" s={0.85} />
        </g>
      ) : (
        <GiftBox x={x} y={y} box="#c77dff" ribbon="#ff4d6d" />
      );
    case 'horror':
      return (
        <g>
          <Candle x={x + (right ? 3 : -3)} y={y} s={1.1} />
          <Candle x={x + (right ? -5 : 5)} y={y} s={0.75} />
        </g>
      );
    case 'zombie':
      return right ? (
        <path d={HAND} transform={`translate(${x} ${y}) scale(1.3)`} fill="hsl(90 25% 34%)" />
      ) : (
        <Barrel x={x} y={y} body="hsl(80 40% 22%)" band="hsl(55 90% 50%)" top="hsl(90 100% 55%)" />
      );
    case 'rocket':
      return (
        <g transform={t}>
          <polygon points="-7,0 -9,-5 -5,-10 1,-9 3,-3 0,0" fill="#6b7280" />
          <polygon points="-5,-10 1,-9 -1,-6 -6,-6" fill="#9ca3af" />
          <polygon points="4,0 5,-4 9,-5 11,-1 9,0" fill="#4b5563" />
          <path d={sparkle(8, -16, 3)} fill="#fff" />
        </g>
      );
    case 'cyber':
      return (
        <g transform={t}>
          <rect x="-7" y="-14" width="14" height="14" rx="1.5" fill="hsl(230 30% 12%)" stroke={hsl(h, 100, 70)} strokeWidth="1" />
          <rect x="-3" y="-10" width="6" height="6" fill={hsl(h, 100, 62)} />
          <path d="M-4 -14 v-3 M0 -14 v-3 M4 -14 v-3 M-7 -10 h-3 M-7 -5 h-3 M7 -10 h3 M7 -5 h3" stroke={hsl(185, 100, 60)} strokeWidth=".9" />
        </g>
      );
    case 'west':
      return right ? (
        <g transform={`translate(${x} ${y - 6})`} fill="none" stroke="hsl(30 40% 40%)" strokeWidth=".9">
          <circle r="6" />
          <path d="M-5 -2 Q0 4 5 -2 M-4 3 Q0 -4 4 3 M-2 -5 Q3 0 -1 5" />
        </g>
      ) : (
        <path d={CACTUS} transform={`translate(${x} ${y}) scale(.95)`} fill="hsl(130 40% 30%)" stroke="hsl(130 40% 16%)" strokeWidth=".5" />
      );
    case 'pirate':
      return right ? (
        <g transform={`translate(${x} ${y})`}>
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={i % 2 ? 0.8 : 0} cy={-2 - i * 3} rx="6.5" ry="2.2" fill={i === 2 ? '#ffe28a' : '#e4ae39'} stroke="#7a4c06" strokeWidth=".5" />
          ))}
          <ellipse cx="9" cy="-2" rx="4" ry="1.6" fill="#e4ae39" stroke="#7a4c06" strokeWidth=".5" />
        </g>
      ) : (
        <path d={ANCHOR} transform={`translate(${x} ${y - 1})`} fill="none" stroke="#c8d0de" strokeWidth="2" strokeLinecap="round" />
      );
    case 'samurai':
      return <Lantern x={x} y={y} s={right ? 0.9 : 1.05} />;
    case 'fantasy':
      return right ? <Potion x={x} y={y} color="#ff4dd2" s={0.9} /> : <Potion x={x} y={y} color={hsl(h, 100, 55)} />;
    case 'noir':
      return right ? (
        <path d={ICONS.fedora} transform={`translate(${x} ${y - 6}) scale(.36) translate(-50 -56)`} fill="#1a1d24" stroke="#5a606c" strokeWidth="1.5" />
      ) : (
        <g transform={`translate(${x} ${y})`}>
          <rect x="-8" y="-9" width="9" height="9" rx="1.5" fill="#f4f1ea" />
          <rect x="1" y="-11" width="8" height="8" rx="1.5" fill="#d8322b" transform="rotate(14 5 -7)" />
          <circle cx="-5.5" cy="-6.5" r=".9" fill="#111" />
          <circle cx="-3.5" cy="-4.5" r=".9" fill="#111" />
          <circle cx="-1.5" cy="-2.5" r=".9" fill="#111" />
        </g>
      );
    case 'wasteland':
      return right ? (
        <Barrel x={x} y={y} body="hsl(18 55% 30%)" band="hsl(20 40% 18%)" top="hsl(20 40% 40%)" />
      ) : (
        <g transform={`translate(${x} ${y - 4})`}>
          <ellipse rx="9" ry="4" fill="#1b1d22" />
          <ellipse rx="4" ry="1.6" fill="#3a3d45" />
        </g>
      );
    case 'race':
      return right ? (
        <g transform={`translate(${x} ${y})`}>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <ellipse cx="0" cy={-2 - i * 4.4} rx="8" ry="2.6" fill="#16181d" stroke="#3a3d45" strokeWidth=".5" />
              <ellipse cx="0" cy={-2.6 - i * 4.4} rx="4" ry="1.1" fill="#2b2e36" />
            </g>
          ))}
        </g>
      ) : (
        <g transform={`translate(${x} ${y})`}>
          <path d="M-7 0 L-2 -16 H2 L7 0 Z" fill="#ff7a1a" />
          <path d="M-4.6 -7 H4.6 L5.4 -4 H-5.4 Z M-3 -12 H3 L3.6 -10 H-3.6 Z" fill="#fff" />
          <rect x="-8" y="-1" width="16" height="2" rx=".5" fill="#ff7a1a" />
        </g>
      );
    default:
      return null;
  }
}
