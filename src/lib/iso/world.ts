// 體素世界：儲存、建模小工具、投影與畫家演算法排序。
import type { MaterialName } from './palette';

// 投影常數：x 往右下、y 往左下、z 往上
export const HALF_W = 8;
export const HALF_H = 4;
export const LAYER = 8;

export interface Voxel {
  x: number;
  y: number;
  z: number;
  m: MaterialName;
  /** 所屬站點，用來做 hover 命中與高亮 */
  tag?: string;
}

/** 體素頂面菱形的最上方頂點（最小角 x,y、高度 z+1）在世界像素座標的位置 */
export function project(x: number, y: number, z: number): { sx: number; sy: number } {
  return { sx: (x - y) * HALF_W, sy: (x + y) * HALF_H - (z + 1) * LAYER };
}

/** sprite 左上角 */
export function spriteOrigin(x: number, y: number, z: number): { sx: number; sy: number } {
  const p = project(x, y, z);
  return { sx: p.sx - HALF_W, sy: p.sy };
}

/** 畫家演算法排序鍵：單位方塊只要比最小角座標和，就能正確前後遮擋 */
export function depthKey(x: number, y: number, z: number): number {
  return x + y + z;
}

export function compareVoxels(a: Voxel, b: Voxel): number {
  return depthKey(a.x, a.y, a.z) - depthKey(b.x, b.y, b.z) || a.z - b.z || a.x - b.x;
}

const OFFSET = 256;
const key = (x: number, y: number, z: number) => ((x + OFFSET) * 512 + (y + OFFSET)) * 512 + (z + OFFSET);

export class VoxelWorld {
  private cells = new Map<number, Voxel>();

  get size(): number {
    return this.cells.size;
  }

  set(x: number, y: number, z: number, m: MaterialName, tag?: string): this {
    this.cells.set(key(x, y, z), { x, y, z, m, tag });
    return this;
  }

  get(x: number, y: number, z: number): Voxel | undefined {
    return this.cells.get(key(x, y, z));
  }

  has(x: number, y: number, z: number): boolean {
    return this.cells.has(key(x, y, z));
  }

  remove(x: number, y: number, z: number): this {
    this.cells.delete(key(x, y, z));
    return this;
  }

  /** 實心長方體，範圍含頭含尾 */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: MaterialName, tag?: string): this {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.set(x, y, z, m, tag);
    return this;
  }

  carve(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): this {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
        for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.remove(x, y, z);
    return this;
  }

  /** 圓柱（圓心可以是半格），每層材質可由 matAt 決定 */
  cylinder(
    cx: number,
    cy: number,
    r: number,
    z0: number,
    z1: number,
    matAt: MaterialName | ((z: number) => MaterialName),
    tag?: string,
  ): this {
    const r2 = r * r;
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy > r2) continue;
        for (let z = z0; z <= z1; z++) this.set(x, y, z, typeof matAt === 'function' ? matAt(z) : matAt, tag);
      }
    return this;
  }

  all(): Voxel[] {
    return [...this.cells.values()];
  }

  /** 剔除 +x、+y、+z 三面都被擋住的體素（它們永遠看不到） */
  visible(): Voxel[] {
    return this.all().filter((v) => !(this.has(v.x + 1, v.y, v.z) && this.has(v.x, v.y + 1, v.z) && this.has(v.x, v.y, v.z + 1)));
  }

  sortedVisible(): Voxel[] {
    return this.visible().sort(compareVoxels);
  }
}

/** 世界像素座標的外框 */
export function screenBounds(voxels: Voxel[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of voxels) {
    const o = spriteOrigin(v.x, v.y, v.z);
    minX = Math.min(minX, o.sx);
    minY = Math.min(minY, o.sy);
    maxX = Math.max(maxX, o.sx + 16);
    maxY = Math.max(maxY, o.sy + 16);
  }
  return { minX, minY, maxX, maxY };
}

/** 可重現的亂數（mulberry32），讓每次建出來的島長得一樣 */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
