// 整站唯一色票：三色油墨（藍 / 粉 / 黃）+ 紙 + 墨。
// 所有中間色都靠 Bayer 網點混出來，而不是新增色號 —— 這就是「tri-tone 網點撞」。

export type InkName =
  | 'paper'
  | 'ink'
  | 'blue'
  | 'pink'
  | 'yellow'
  | 'blueLt'
  | 'pinkLt'
  | 'yellowLt'
  | 'blueDk'
  | 'purple'
  | 'orange';
export type Rgb = readonly [number, number, number];

export const INKS: Record<InkName, Rgb> = {
  paper: [243, 238, 226],
  ink: [24, 20, 43],
  blue: [48, 79, 254],
  pink: [255, 62, 134],
  yellow: [255, 207, 51],
  // 同一色油墨的淡網（平塗）與兩色疊印：仍然只有三色油墨
  blueLt: [147, 165, 255],
  pinkLt: [255, 163, 198],
  yellowLt: [255, 229, 138],
  blueDk: [32, 49, 184],
  purple: [154, 60, 224],
  orange: [255, 122, 61],
};

export const INK_HEX: Record<InkName, string> = Object.fromEntries(
  Object.entries(INKS).map(([k, [r, g, b]]) => [
    k,
    `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
  ]),
) as Record<InkName, string>;

// 4x4 Bayer 矩陣（0..15）。level 0 = 全 a 色，level 16 = 全 b 色。
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;

/** 該像素是否要用第二色。座標用全域像素座標，網點才能跨 sprite 對齊。 */
export function useSecond(level: number, x: number, y: number): boolean {
  return BAYER4[((y & 3) << 2) | (x & 3)] < level;
}

export interface Fill {
  a: InkName;
  b?: InkName;
  /** 0..16，b 色所佔比例 */
  level?: number;
}

export interface Material {
  top: Fill;
  left: Fill;
  right: Fill;
}

export function fillAt(fill: Fill, x: number, y: number): InkName {
  return fill.b && useSecond(fill.level ?? 0, x, y) ? fill.b : fill.a;
}

const f = (a: InkName, b?: InkName, level = 0): Fill => ({ a, b, level });

// 光源在左上：頂面最亮、左面（+y）中間、右面（+x）最暗。
// 大面積用平塗，網點只當紋理；暗部用疊印色（黃+粉=橘、粉+藍=紫）。
export const MATERIALS = {
  grass: { top: f('yellowLt', 'yellow', 2), left: f('orange'), right: f('purple') },
  grassAlt: { top: f('yellow', 'yellowLt', 3), left: f('orange'), right: f('purple') },
  path: { top: f('paper'), left: f('pinkLt'), right: f('pink') },
  water: { top: f('blueLt', 'paper', 3), left: f('blue'), right: f('blueDk') },
  rock: { top: f('pinkLt'), left: f('pink', 'purple', 5), right: f('purple', 'blueDk', 4) },
  rockDeep: { top: f('purple'), left: f('purple', 'blueDk', 6), right: f('blueDk', 'ink', 5) },
  mountain: { top: f('blueLt'), left: f('blue'), right: f('blueDk') },
  snow: { top: f('paper'), left: f('paper', 'blueLt', 6), right: f('blueLt') },
  paper: { top: f('paper'), left: f('paper', 'blueLt', 3), right: f('blueLt') },
  blue: { top: f('blueLt'), left: f('blue'), right: f('blueDk') },
  blueDark: { top: f('blue'), left: f('blueDk'), right: f('ink') },
  pink: { top: f('pinkLt'), left: f('pink'), right: f('purple') },
  yellow: { top: f('yellowLt'), left: f('yellow'), right: f('orange') },
  glass: { top: f('yellowLt', 'paper', 6), left: f('yellow', 'paper', 4), right: f('yellow') },
  ink: { top: f('blueDk'), left: f('ink', 'blueDk', 4), right: f('ink') },
  beltA: { top: f('ink'), left: f('ink'), right: f('ink') },
  beltB: { top: f('ink', 'yellow', 2), left: f('ink'), right: f('ink') },
  hazard: { top: f('yellow'), left: f('yellow'), right: f('orange') },
  cloud: { top: f('paper', 'blueLt', 3), left: f('blueLt', 'paper', 5), right: f('blueLt', 'blue', 4) },
  leafBlue: { top: f('blueLt'), left: f('blue'), right: f('blueDk') },
  leafPink: { top: f('pinkLt'), left: f('pink'), right: f('purple') },
  trunk: { top: f('purple'), left: f('purple'), right: f('ink') },
  window: { top: f('blueLt'), left: f('blueLt', 'paper', 5), right: f('blue') },
  core: { top: f('pinkLt', 'yellow', 5), left: f('pink'), right: f('orange') },
  // 品牌方塊：一面一色，三色油墨各佔一面
  product: { top: f('yellow'), left: f('pink'), right: f('blue') },
} satisfies Record<string, Material>;

export type MaterialName = keyof typeof MATERIALS;
