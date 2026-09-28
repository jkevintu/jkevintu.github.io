// 島上的動態：輸送帶物件、火箭、燈塔光束、天線電波、沖壓機、煙、指示燈、小人。
import { ANCHORS, GATES, LEG1, PATH_LENGTH, SERVER_LEDS, WALK_Y, pointOnPath, rocketVoxels } from './island';
import type { InkName } from './palette';
import type { Drawable, Painter } from './render';
import { SPRITE, faceMask } from './sprite';
import { spriteOrigin } from './world';

const MASK = faceMask();

// 面與面之間、以及外輪廓的像素 → 線稿方塊
const EDGE: boolean[] = MASK.map((face, i) => {
  if (!face) return false;
  const x = i % SPRITE;
  const y = (i / SPRITE) | 0;
  const at = (dx: number, dy: number) => {
    const nx = x + dx;
    const ny = y + dy;
    return nx < 0 || ny < 0 || nx >= SPRITE || ny >= SPRITE ? null : MASK[ny * SPRITE + nx];
  };
  return [at(1, 0), at(-1, 0), at(0, 1), at(0, -1)].some((n) => n !== face);
});

/** 便宜的整數雜湊 → 0..1 */
export function hash01(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export type ItemStage = 'fuzzy' | 'blueprint' | 'wired' | 'product';

/** 依路線距離判斷升級階段（閘門都在第一段） */
export function stageAt(s: number): ItemStage {
  const x = pointOnPath(Math.min(s, LEG1)).x;
  if (x < GATES.blueprint) return 'fuzzy';
  if (x < GATES.wired) return 'blueprint';
  if (x < GATES.product) return 'wired';
  return 'product';
}

export const ITEM_SPEED = 1.1;
// 最後半格讓物件「鑽進」裝填口後消失
const SPAN = PATH_LENGTH - 0.5;
const ITEM_COUNT = Math.round(SPAN / 3.4);
/** 實際間距：剛好整除一圈，循環接縫處才不會出現大空隙 */
export const ITEM_SPACING = SPAN / ITEM_COUNT;

export interface ItemPos {
  id: number;
  /** 沿路線的距離 */
  s: number;
  x: number;
  y: number;
}

/** 輸送帶上每個物件在時間 t 的位置（物件中心） */
export function itemPositions(t: number): ItemPos[] {
  return Array.from({ length: ITEM_COUNT }, (_, id) => {
    const s = (((t * ITEM_SPEED + id * ITEM_SPACING) % SPAN) + SPAN) % SPAN;
    return { id, s, ...pointOnPath(s) };
  });
}

// 3x5 像素字
const GLYPHS: Record<string, string[]> = {
  K: ['X.X', 'XX.', 'X..', 'XX.', 'X.X'],
  '2': ['XX.', '..X', '.X.', 'X..', 'XXX'],
  '?': ['XX.', '..X', '.X.', '...', '.X.'],
};

export function glyphs(p: Painter, text: string, cx: number, cy: number, ink: InkName): void {
  let x = Math.round(cx);
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (!g) continue;
    g.forEach((row, ry) => [...row].forEach((c, rx) => c === 'X' && p.px(x + rx, cy + ry, ink)));
    x += 4;
  }
}

/** 帶底框的名牌 */
export function tag(p: Painter, text: string, cx: number, cy: number, bg: InkName = 'ink', fg: InkName = 'paper'): void {
  const w = text.length * 4 + 3;
  p.rect(cx - Math.floor(w / 2), cy, w, 9, bg);
  p.rect(cx - 1, cy + 9, 3, 1, bg);
  p.px(cx, cy + 10, bg);
  glyphs(p, text, cx - Math.floor(w / 2) + 2, cy + 2, fg);
}

function drawItem(p: Painter, it: ItemPos, t: number): void {
  const { id } = it;
  const stage = stageAt(it.s);
  const vx = it.x - 0.5;
  const vy = it.y - 0.5;
  if (stage === 'product') {
    p.cube(vx, vy, 2, 'product');
    const o = spriteOrigin(vx, vy, 2);
    if (hash01(id * 31 + Math.floor(t * 6)) > 0.7) p.px(o.sx + p.ox + 3 + (id % 3) * 4, o.sy + p.oy + 2, 'paper');
    return;
  }
  const o = spriteOrigin(vx, vy, 2);
  const ox = Math.round(o.sx + p.ox);
  const oy = Math.round(o.sy + p.oy);
  if (stage === 'fuzzy') {
    // 真的是「模糊」的：每 1/10 秒重新灑一次像素
    const bucket = Math.floor(t * 10);
    const colors: InkName[] = ['pink', 'blue', 'ink', 'blue', 'yellow'];
    for (let i = 0; i < MASK.length; i++) {
      if (!MASK[i]) continue;
      const r = hash01(id * 7919 + bucket * 131 + i);
      if (r > 0.5) continue;
      const jx = r < 0.06 ? -2 : r > 0.44 ? 2 : 0;
      p.px(ox + (i % SPRITE) + jx, oy + ((i / SPRITE) | 0), colors[Math.floor(r * 10) % colors.length]);
    }
    return;
  }
  for (let i = 0; i < MASK.length; i++) {
    if (!MASK[i]) continue;
    p.px(ox + (i % SPRITE), oy + ((i / SPRITE) | 0), EDGE[i] ? 'blue' : 'paper');
  }
  if (stage === 'wired') {
    const on = Math.sin(t * 8 + id) > -0.2;
    p.rect(ox + 3, oy + 9, 2, 2, on ? 'pink' : 'blue');
    p.rect(ox + 11, oy + 9, 2, 2, on ? 'pink' : 'blue');
    p.rect(ox + 7, oy + 3, 2, 2, 'pink');
  }
}

export function items(t: number): Drawable[] {
  return itemPositions(t).map((it) => ({
    key: it.x - 0.5 + it.y - 0.5 + 2,
    draw: (p: Painter) => drawItem(p, it, t),
  }));
}

/** 火箭最高飛多高（體素） */
export const ROCKET_LIFT = 42;

/** 火箭：launch 0..1 時往上飛 */
export function rocket(launch: number): Drawable[] {
  const [ax, ay, az] = ANCHORS.rocket;
  const lift = launch <= 0 ? 0 : launch * launch * ROCKET_LIFT;
  return rocketVoxels().map((v) => {
    const x = ax + v.x;
    const y = ay + v.y;
    const z = az + v.z + lift;
    return { key: x + y + z, draw: (p: Painter) => p.cube(x, y, z, v.m) };
  });
}

export function rocketExhaust(p: Painter, launch: number, t: number): void {
  if (launch <= 0) return;
  const [ax, ay, az] = ANCHORS.rocket;
  const lift = launch * launch * ROCKET_LIFT;
  const base = p.toCanvas(ax + 0.5, ay + 0.5, az + lift);
  // 火焰
  const len = 10 + Math.sin(t * 40) * 3 + launch * 16;
  p.dither(base.cx - 8, base.cy, base.cx + 8, base.cy + len, 'yellow', 12, (x, y) => Math.abs(x - base.cx) < 6 * (1 - (y - base.cy) / len));
  p.dither(base.cx - 5, base.cy, base.cx + 5, base.cy + len * 0.7, 'pink', 9, (x, y) => Math.abs(x - base.cx) < 3.5 * (1 - (y - base.cy) / (len * 0.7)));
  // 尾煙：沿著飛行路徑的一串網點
  for (let k = 1; k < 9; k++) {
    const z = az + lift - k * (lift / 9) - 1;
    if (z < az) break;
    const c = p.toCanvas(ax + 0.5, ay + 0.5, z);
    const r = 3 + k * 0.9;
    p.dither(c.cx - r, c.cy - r, c.cx + r, c.cy + r, 'paper', Math.max(2, 12 - k), (x, y) => (x - c.cx) ** 2 + (y - c.cy) ** 2 < r * r);
  }
  // 發射台上的煙
  const pad = p.toCanvas(ax + 0.5, ay + 0.5, 2);
  const spread = Math.min(1, launch * 3);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.4;
    const r = 6 + spread * 30;
    const cx = pad.cx + Math.cos(a) * r * 1.6;
    const cy = pad.cy + Math.sin(a) * r * 0.55 - spread * 4;
    const rad = 5 + spread * 9;
    const level = Math.max(2, Math.round(14 - launch * 12));
    p.dither(cx - rad, cy - rad, cx + rad, cy + rad, 'paper', level, (x, y) => (x - cx) ** 2 + (y - cy) ** 2 < rad * rad);
    p.dither(cx - rad, cy, cx + rad, cy + rad, 'blue', Math.max(1, level - 10), (x, y) => (x - cx) ** 2 + (y - cy) ** 2 < rad * rad);
  }
}

/** AI 核心：浮在屋頂上、會呼吸的粉紅方塊 */
export function coreCube(t: number): Drawable[] {
  const [cx, cy, cz] = ANCHORS.core;
  const bob = Math.sin(t * 2.2) * 0.35;
  const out: Drawable[] = [];
  for (let x = 0; x < 2; x++)
    for (let y = 0; y < 2; y++)
      for (let z = 0; z < 2; z++) {
        const X = cx + x;
        const Y = cy + y;
        const Z = cz + z + 0.4 + bob;
        out.push({ key: X + Y + Z, draw: (p) => p.cube(X, Y, Z, 'core') });
      }
  return out;
}

/** 沖壓機：有物件經過正下方就壓下去 */
export function pressHeight(t: number): number {
  const [px] = ANCHORS.press;
  const d = Math.min(...itemPositions(t).map((it) => (it.s <= LEG1 ? Math.abs(it.x - px) : Infinity)));
  const s = Math.min(1, d / 1.1);
  return 3 + 2.2 * s * s;
}

export function press(t: number): Drawable[] {
  const [px, py] = ANCHORS.press;
  const z = pressHeight(t);
  const y0 = Math.floor(py);
  return [0, 1].map((dy) => ({
    key: px + y0 + dy + z,
    draw: (p: Painter) => {
      p.cube(px, y0 + dy, z, 'blueDark');
      // 活塞桿
      const top = p.toCanvas(px + 0.5, y0 + dy + 0.5, z + 1);
      const beam = p.toCanvas(px + 0.5, y0 + dy + 0.5, 7);
      p.rect(top.cx - 1, beam.cy, 2, Math.max(0, top.cy - beam.cy), 'ink');
    },
  }));
}

export function pressSparks(p: Painter, t: number): void {
  if (pressHeight(t) > 3.25) return;
  const [px, py] = ANCHORS.press;
  const c = p.toCanvas(px + 0.5, py + 0.5, 3);
  const bucket = Math.floor(t * 20);
  for (let k = 0; k < 10; k++) {
    const r = hash01(bucket * 17 + k);
    const a = r * Math.PI * 2;
    const d = 6 + hash01(bucket * 3 + k * 5) * 12;
    p.px(c.cx + Math.cos(a) * d, c.cy + Math.sin(a) * d * 0.5 - 2, k % 2 ? 'yellow' : 'pink');
  }
}

export function serverLeds(t: number): Drawable[] {
  return SERVER_LEDS.map(([x, z], i) => ({
    key: x + 15 + z + 0.01,
    draw: (p: Painter) => {
      const on = hash01(i * 97 + Math.floor(t * (3 + (i % 3)))) > 0.35;
      const o = spriteOrigin(x, 15, z);
      p.rect(o.sx + p.ox + 3, o.sy + p.oy + 9, 2, 1, on ? (i % 3 ? 'yellow' : 'pink') : 'ink');
    },
  }));
}

export function lighthouseBeam(p: Painter, t: number): void {
  const [lx, ly, lz] = ANCHORS.lantern;
  const c = p.toCanvas(lx, ly, lz);
  const theta = t * 0.9;
  const toward = Math.cos(theta) + Math.sin(theta); // >0 表示朝向鏡頭這一側
  if (toward < -0.3) return;
  const end = (a: number) => {
    const w = p.toCanvas(lx + Math.cos(a) * 14, ly + Math.sin(a) * 14, lz);
    return { x: w.cx, y: w.cy };
  };
  const A = { x: c.cx, y: c.cy };
  const B = end(theta - 0.16);
  const C = end(theta + 0.16);
  const sign = (p1: { x: number; y: number }, p2: { x: number; y: number }, x: number, y: number) =>
    (x - p2.x) * (p1.y - p2.y) - (p1.x - p2.x) * (y - p2.y);
  const inside = (x: number, y: number) => {
    const d1 = sign(A, B, x, y);
    const d2 = sign(B, C, x, y);
    const d3 = sign(C, A, x, y);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const level = Math.round(3 + 4 * Math.min(1, toward + 0.3));
  p.dither(Math.min(A.x, B.x, C.x), Math.min(A.y, B.y, C.y), Math.max(A.x, B.x, C.x), Math.max(A.y, B.y, C.y), 'yellow', level, inside);
  // 燈室閃光
  if (Math.sin(t * 6) > 0) p.rect(c.cx - 2, c.cy - 2, 4, 3, 'paper');
}

export function dishWaves(p: Painter, t: number): void {
  const [dx, dy, dz] = ANCHORS.dish;
  const c = p.toCanvas(dx, dy, dz);
  for (let k = 0; k < 3; k++) {
    const life = (t * 0.6 + k / 3) % 1;
    const r = 0.6 + life * 2.6;
    p.ellipse(c.cx, c.cy - 2 - life * 10, r * 11.3, r * 5.66, life > 0.6 ? 'blue' : 'pink', life > 0.45 ? 2 : 0);
  }
}

export function chimneySmoke(p: Painter, t: number): void {
  const [sx, sy, sz] = ANCHORS.chimney;
  const c = p.toCanvas(sx, sy, sz);
  for (let k = 0; k < 4; k++) {
    const life = (t * 0.35 + k / 4) % 1;
    const cx = c.cx + life * 18 + Math.sin(t + k) * 2;
    const cy = c.cy - life * 34;
    const r = 2 + life * 6;
    p.dither(cx - r, cy - r, cx + r, cy + r, 'paper', Math.round(14 - life * 11), (x, y) => (x - cx) ** 2 + (y - cy) ** 2 < r * r);
  }
}

/** 雲往進料機灑下模糊的像素，偶爾冒出問號 */
export function fogRain(p: Painter, t: number): void {
  const top = ANCHORS.cloud[2];
  const bottom = ANCHORS.hopper[2];
  for (let k = 0; k < 16; k++) {
    const x = 1.6 + hash01(k * 13) * 2;
    const y = 11.6 + hash01(k * 29) * 2;
    const life = (t * (0.5 + hash01(k) * 0.4) + hash01(k * 7)) % 1;
    const c = p.toCanvas(x, y, top - life * (top - bottom));
    p.px(c.cx + (hash01(k + Math.floor(t * 8)) > 0.5 ? 1 : 0), c.cy, (['blue', 'pink', 'ink'] as const)[k % 3]);
  }
  for (let k = 0; k < 2; k++) {
    const life = (t * 0.25 + k * 0.5) % 1;
    const c = p.toCanvas(2.5 + k * 1.5, 12, 12 + life * 4);
    if (life < 0.85) glyphs(p, '?', c.cx - 1 + Math.sin(t * 2 + k) * 3, c.cy, k ? 'pink' : 'ink');
  }
}

// 小人（熊）的像素圖：B 毛、F 臉、I 墨、H 帽 T、L 腳
const AVATAR_BODY = [
  '.BB..BB.',
  '.BBBBBB.',
  'BBFFFFBB',
  'BFIFFIFB',
  'BFFIIFFB',
  '.BBBBBB.',
  '..HHHH..',
  '.HHHHHH.',
  'BHHHHHHB',
  '..HHHH..',
];
const AVATAR_LEGS = [
  ['..L..L..', '..L..L..'],
  ['.L....L.', '..L..L..'],
  ['..L..L..', '.L....L.'],
];
const AVATAR_INK: Record<string, InkName> = { B: 'blue', F: 'paper', I: 'ink', H: 'pink', L: 'ink' };

export interface Walker {
  x: number;
  walking: boolean;
  facing: 1 | -1;
}

export function avatar(w: Walker, t: number): Drawable {
  const y = WALK_Y + 0.5;
  return {
    key: w.x + WALK_Y + 1 + 0.2,
    draw: (p) => {
      const foot = p.toCanvas(w.x, y, 1);
      const frame = w.walking ? 1 + (Math.floor(w.x * 3) % 2) : 0;
      const bob = !w.walking && Math.sin(t * 3) > 0.6 ? 1 : 0;
      const rows = [...AVATAR_BODY, ...AVATAR_LEGS[frame]];
      const x0 = Math.round(foot.cx) - 4;
      const y0 = Math.round(foot.cy) - rows.length + bob;
      rows.forEach((row, ry) =>
        [...row].forEach((ch, rx) => {
          if (ch === '.') return;
          const col = w.facing === 1 ? rx : 7 - rx;
          p.px(x0 + col, y0 + ry - (ry >= AVATAR_BODY.length ? 0 : bob), AVATAR_INK[ch]);
        }),
      );
    },
  };
}

export function avatarTag(p: Painter, w: Walker, t: number): void {
  const head = p.toCanvas(w.x, WALK_Y + 0.5, 1);
  const float = Math.round(Math.sin(t * 2.5) * 1.5);
  tag(p, 'K2', head.cx, head.cy - 27 + float, 'ink', 'yellow');
}

export function peakFlag(p: Painter, t: number): void {
  const [x, y, z] = ANCHORS.peak;
  const c = p.toCanvas(x + 0.5, y + 0.5, z);
  p.rect(c.cx, c.cy - 12, 1, 12, 'ink');
  const wave = Math.floor(t * 4) % 2;
  p.rect(c.cx + 1, c.cy - 12 + wave, 6, 4, 'pink');
  glyphs(p, 'K2', c.cx - 3, c.cy - 20, 'ink');
}

/** 天空中慢慢飄的網點雲（純 2D，畫在島後面） */
export function skyClouds(p: Painter, t: number): void {
  const W = p.canvas.width;
  const clouds = [
    { y: 40, s: 1, speed: 3, off: 0.1 },
    { y: 90, s: 0.7, speed: 5, off: 0.55 },
    { y: 150, s: 0.85, speed: 4, off: 0.8 },
  ];
  for (const c of clouds) {
    const span = W + 160;
    const cx = ((c.off * span + t * c.speed) % span) - 80;
    const blobs = [
      [0, 0, 14],
      [-16, 5, 10],
      [16, 4, 11],
      [30, 7, 7],
    ];
    for (const [bx, by, r] of blobs) {
      const x = cx + bx * c.s;
      const y = c.y + by * c.s;
      const R = r * c.s;
      p.dither(x - R, y - R, x + R, y + R, 'paper', 16, (px, py) => (px - x) ** 2 + (py - y) ** 2 < R * R);
      p.dither(x - R, y, x + R, y + R, 'blue', 3, (px, py) => (px - x) ** 2 + (py - y) ** 2 < R * R && py > y + R * 0.3);
    }
  }
}

/** 瞄準框：hover 站點時的四角括號 */
export function reticle(p: Painter, b: { x0: number; y0: number; x1: number; y1: number }, t: number): void {
  const pad = 3 + (Math.floor(t * 4) % 2);
  const x0 = b.x0 - pad;
  const y0 = b.y0 - pad;
  const x1 = b.x1 + pad;
  const y1 = b.y1 + pad;
  const L = 6;
  for (const [x, y, sx, sy] of [
    [x0, y0, 1, 1],
    [x1, y0, -1, 1],
    [x0, y1, 1, -1],
    [x1, y1, -1, -1],
  ] as const) {
    p.rect(sx > 0 ? x : x - L + 1, y, L, 1, 'pink');
    p.rect(x, sy > 0 ? y : y - L + 1, 1, L, 'pink');
  }
}
