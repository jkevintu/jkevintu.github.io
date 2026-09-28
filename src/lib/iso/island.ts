// 首頁浮空島：一條輸送帶把「模糊想法」一路送進火箭。
// 站點由左上到右下排列，捲動時鏡頭就沿著輸送帶往下飛。
import type { Phase } from './camera';
import type { MaterialName } from './palette';
import { VoxelWorld, rng } from './world';

export const ISLAND_X = 38;
export const ISLAND_Y = 24;
export const BELT_Y = 12; // 第一段輸送帶佔 y = 12..13
export const BELT_X0 = 4;
export const BELT_TURN_X = 32; // 轉角：第二段佔 x = 32..33，往 -y 送進火箭
export const BELT_END_Y = 8;
export const WALK_Y = 16;

/** 物件中心的行進路線：先沿 +x，再轉 -y */
export const ITEM_PATH = {
  start: [BELT_X0, BELT_Y + 1] as const,
  corner: [BELT_TURN_X + 1, BELT_Y + 1] as const,
  end: [BELT_TURN_X + 1, BELT_END_Y] as const,
};
export const LEG1 = ITEM_PATH.corner[0] - ITEM_PATH.start[0];
export const PATH_LENGTH = LEG1 + (ITEM_PATH.corner[1] - ITEM_PATH.end[1]);

export function pointOnPath(s: number): { x: number; y: number } {
  if (s <= LEG1) return { x: ITEM_PATH.start[0] + s, y: ITEM_PATH.start[1] };
  return { x: ITEM_PATH.corner[0], y: ITEM_PATH.corner[1] - (s - LEG1) };
}

export type StationId = 'fog' | 'lighthouse' | 'core' | 'workshop' | 'launch';

export interface Station {
  id: StationId;
  /** 鏡頭焦點（世界座標） */
  focus: readonly [number, number, number];
  /** 鏡頭要框進來的範圍（世界像素） */
  view: readonly [number, number];
  /** 小人走到哪 */
  walkX: number;
}

export const STATIONS: readonly Station[] = [
  { id: 'fog', focus: [3, 12, 5], view: [190, 170], walkX: 4 },
  { id: 'lighthouse', focus: [11, 9, 8], view: [180, 210], walkX: 11 },
  { id: 'core', focus: [19, 12, 5], view: [200, 180], walkX: 19 },
  { id: 'workshop', focus: [27, 10, 4], view: [200, 170], walkX: 27 },
  { id: 'launch', focus: [35, 5, 7], view: [180, 210], walkX: 34 },
];

// 導覽節奏：第 0 段是開場，之後每站「飛行 + 停留」（單位：一個視窗高）
export const TOUR_PHASES: readonly Phase[] = [
  { travel: 0, hold: 0.45 },
  { travel: 0.6, hold: 0.6 },
  { travel: 0.6, hold: 0.6 },
  { travel: 0.6, hold: 0.6 },
  { travel: 0.6, hold: 0.6 },
  { travel: 0.6, hold: 1.3 },
];

/** 輸送帶上的物件走到這些 x 會「升級」 */
export const GATES = { blueprint: 11.5, wired: 19, product: 27 } as const;

/** 動態物件的錨點 */
export const ANCHORS = {
  cloud: [2.5, 12.5, 8],
  hopper: [2.5, 12.5, 5],
  lantern: [11.5, 7.5, 15],
  core: [18, 11, 8],
  dish: [21.5, 9.5, 14],
  chimney: [29.5, 7.5, 10],
  press: [27, 12.5, 3],
  rocket: [35, 5, 2],
  peak: [5, 4, 14],
} as const satisfies Record<string, readonly [number, number, number]>;

/** 伺服器機櫃正面（y = 15 那面）的指示燈位置 */
export const SERVER_LEDS: ReadonlyArray<readonly [number, number]> = [
  [16, 2], [16, 4], [17, 5], [18, 2], [18, 4], [19, 3], [20, 2], [20, 5], [21, 3], [21, 4],
];

function insideIsland(x: number, y: number): boolean {
  // 圓角矩形
  const r = 5;
  const cx = Math.min(Math.max(x + 0.5, r), ISLAND_X - r);
  const cy = Math.min(Math.max(y + 0.5, r), ISLAND_Y - r);
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  return dx * dx + dy * dy <= r * r;
}

function tree(w: VoxelWorld, x: number, y: number, leaf: MaterialName, tall = false): void {
  w.box(x, y, 1, x, y, tall ? 2 : 1, 'trunk');
  const base = tall ? 3 : 2;
  w.box(x - 1, y - 1, base, x + 1, y + 1, base, leaf);
  w.set(x, y, base + 1, leaf).set(x + 1, y, base + 1, leaf).set(x, y + 1, base + 1, leaf);
  w.set(x, y, base + 2, leaf);
}

export function buildIsland(): VoxelWorld {
  const w = new VoxelWorld();
  const rand = rng(20260928);

  // ── 地面與浮島底部 ─────────────────────────────
  for (let x = 0; x < ISLAND_X; x++) {
    for (let y = 0; y < ISLAND_Y; y++) {
      if (!insideIsland(x, y)) continue;
      const edge = x === 0 || y === 0 || x === ISLAND_X - 1 || y === ISLAND_Y - 1;
      if (edge && rand() < 0.25) continue;
      const patch = Math.sin(x * 0.55 + y * 0.2) + Math.cos(y * 0.7 - x * 0.15) > 1.1;
      w.set(x, y, 0, patch ? 'grassAlt' : 'grass');
      // 離中心越遠越淺，形成往下收的岩塊
      const nx = (x + 0.5 - ISLAND_X / 2) / (ISLAND_X / 2);
      const ny = (y + 0.5 - ISLAND_Y / 2) / (ISLAND_Y / 2);
      const d = Math.sqrt(nx * nx + ny * ny);
      const depth = Math.max(1, Math.min(9, Math.floor((1.3 - d) * 16 + rand() * 1.6)));
      for (let z = -1; z >= -depth; z--) w.set(x, y, z, z > -4 ? 'rock' : 'rockDeep');
    }
  }

  // 小路（小人走的地方）與池塘
  for (let x = 1; x < ISLAND_X - 1; x++) if (w.has(x, WALK_Y, 0)) w.set(x, WALK_Y, 0, 'path');
  for (let x = 13; x <= 18; x++)
    for (let y = 18; y <= 22; y++) {
      const dx = (x - 15.5) / 2.8;
      const dy = (y - 20) / 2.2;
      if (dx * dx + dy * dy <= 1 && w.has(x, y, 0)) w.set(x, y, 0, 'water');
    }

  // ── K2 山：島的最後方 ───────────────────────────
  const peaks: Array<[number, number, number, number]> = [
    [5, 4, 13, 2.2],
    [10, 2, 7, 2.4],
  ];
  for (let x = 0; x < 15; x++)
    for (let y = 0; y < 11; y++) {
      if (!w.has(x, y, 0)) continue;
      let h = 0;
      for (const [px, py, ph, slope] of peaks) {
        const dist = Math.hypot(x - px, y - py);
        h = Math.max(h, Math.round(ph - dist * slope + (rand() - 0.5)));
      }
      for (let z = 1; z <= h; z++) w.set(x, y, z, z >= 10 || (z >= 8 && z === h) ? 'snow' : 'mountain');
    }

  // ── 01 迷霧：進料機 + 雲 ─────────────────────────
  w.box(1, 11, 1, 3, 14, 3, 'blue', 'fog');
  for (let x = 1; x <= 3; x++)
    for (let y = 11; y <= 14; y++) if (x !== 2 || y === 11 || y === 14) w.set(x, y, 4, 'pink', 'fog');
  for (let x = -1; x <= 6; x++)
    for (let y = 9; y <= 16; y++)
      for (let z = 8; z <= 11; z++) {
        const dx = (x + 0.5 - 2.5) / 3.4;
        const dy = (y + 0.5 - 12.5) / 3.4;
        const dz = (z + 0.5 - 9.5) / 1.9;
        if (dx * dx + dy * dy + dz * dz <= 1 + (rand() - 0.5) * 0.35) w.set(x, y, z, 'cloud', 'fog');
      }

  // ── 02 燈塔：產品思維 ────────────────────────────
  w.cylinder(11.5, 7.5, 2.3, 1, 12, (z) => (Math.floor((z - 1) / 3) % 2 ? 'paper' : 'pink'), 'lighthouse');
  w.cylinder(11.5, 7.5, 2.9, 13, 13, 'ink', 'lighthouse');
  w.cylinder(11.5, 7.5, 1.5, 14, 15, 'glass', 'lighthouse');
  w.cylinder(11.5, 7.5, 1.6, 16, 16, 'pink', 'lighthouse');
  w.set(11, 7, 17, 'pink', 'lighthouse');
  // 掃描門
  w.box(11, 11, 1, 11, 11, 4, 'blueDark', 'lighthouse');
  w.box(11, 14, 1, 11, 14, 4, 'blueDark', 'lighthouse');
  w.box(11, 11, 5, 11, 14, 5, 'blue', 'lighthouse');

  // ── 03 AI 核心：機房 + 天線 ──────────────────────
  w.box(16, 9, 1, 21, 15, 6, 'blue', 'core');
  for (let x = 16; x <= 21; x += 2) w.box(x, 15, 2, x, 15, 5, 'blueDark', 'core');
  w.carve(16, 12, 1, 21, 13, 3);
  for (let x = 16; x <= 21; x++)
    for (let y = 9; y <= 15; y++) if (x === 16 || x === 21 || y === 9 || y === 15) w.set(x, y, 7, 'ink', 'core');
  w.box(21, 9, 8, 21, 9, 12, 'ink', 'core');
  w.cylinder(21.5, 9.5, 1.6, 13, 13, 'paper', 'core');

  // ── 04 工坊：設計工程 ────────────────────────────
  w.box(24, 6, 1, 29, 10, 4, 'yellow', 'workshop');
  for (const x of [25, 27]) w.set(x, 10, 3, 'window', 'workshop');
  w.set(29, 8, 3, 'window', 'workshop');
  for (let i = 0; i < 3; i++) {
    const x = 24 + i * 2;
    w.box(x, 6, 5, x, 10, 6, 'pink', 'workshop');
    w.box(x + 1, 6, 5, x + 1, 10, 5, 'glass', 'workshop');
  }
  w.box(29, 7, 6, 29, 7, 9, 'ink', 'workshop');
  w.box(27, 11, 1, 27, 11, 6, 'ink', 'workshop');
  w.box(27, 14, 1, 27, 14, 6, 'ink', 'workshop');
  for (let y = 11; y <= 14; y++) w.set(27, y, 7, y % 2 ? 'hazard' : 'ink', 'workshop');

  // ── 05 發射台（右後角，避免擋住工坊） ─────────────
  for (let x = 34; x <= 37; x++)
    for (let y = 1; y <= 9; y++) {
      if (!w.has(x, y, 0)) continue;
      const rim = x === 34 || x === 37 || y === 1 || y === 9;
      w.set(x, y, 1, rim && (x + y) % 2 === 0 ? 'hazard' : 'ink', 'launch');
    }
  // 輸送帶盡頭的裝填口
  w.box(32, 7, 1, 33, 7, 3, 'pink', 'launch');
  w.box(32, 7, 4, 33, 7, 4, 'ink', 'launch');
  w.box(37, 3, 2, 37, 3, 13, 'ink', 'launch');
  w.set(37, 4, 6, 'ink', 'launch').set(37, 4, 10, 'ink', 'launch');
  w.set(37, 3, 14, 'core', 'launch');

  // ── 輸送帶：最後鋪，才不會被建築（例如機房隧道）挖掉 ──
  for (let x = BELT_X0; x <= BELT_TURN_X + 1; x++) w.box(x, BELT_Y, 1, x, BELT_Y + 1, 1, x % 2 ? 'beltA' : 'beltB');
  for (let y = BELT_END_Y; y < BELT_Y; y++) w.box(BELT_TURN_X, y, 1, BELT_TURN_X + 1, y, 1, y % 2 ? 'beltA' : 'beltB');

  // ── 樹 ───────────────────────────────────────
  const trees: Array<[number, number, MaterialName, boolean]> = [
    [3, 20, 'leafBlue', true],
    [9, 20, 'leafPink', false],
    [22, 20, 'leafBlue', false],
    [30, 21, 'leafPink', true],
    [35, 20, 'leafBlue', false],
    [17, 3, 'leafBlue', true],
    [22, 2, 'leafPink', false],
    [31, 2, 'leafBlue', true],
  ];
  for (const [x, y, leaf, tall] of trees) if (w.has(x, y, 0)) tree(w, x, y, leaf, tall);

  return w;
}

/** 火箭（動態物件，發射時整組往上移）。座標相對於 ANCHORS.rocket */
export function rocketVoxels(): Array<{ x: number; y: number; z: number; m: MaterialName }> {
  const out: Array<{ x: number; y: number; z: number; m: MaterialName }> = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = 0; z <= 7; z++) out.push({ x, y, z, m: z === 4 ? 'pink' : 'paper' });
  out.push({ x: 1, y: 0, z: 6, m: 'window' }, { x: 0, y: 1, z: 6, m: 'window' });
  for (const [x, y] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) out.push({ x, y, z: 8, m: 'pink' });
  out.push({ x: 0, y: 0, z: 9, m: 'pink' });
  for (const [x, y] of [[2, 0], [-2, 0], [0, 2], [0, -2]] as const) out.push({ x, y, z: 0, m: 'pink' }, { x, y, z: 1, m: 'pink' });
  // 窗戶取代同位置的機身
  const seen = new Map<string, (typeof out)[number]>();
  for (const v of out) seen.set(`${v.x},${v.y},${v.z}`, v);
  return [...seen.values()];
}
