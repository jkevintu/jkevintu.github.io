// 瀏覽器端繪製：在「原生解析度」畫布上用 sprite 畫體素，再由外層放大（最近鄰）。
import { INK_HEX, MATERIALS, useSecond, type InkName, type MaterialName } from './palette';
import { SPRITE, cubeRGBA } from './sprite';
import { depthKey, spriteOrigin, type Voxel } from './world';

export interface Drawable {
  /** 與體素相同的深度鍵（最小角座標和） */
  key: number;
  draw(p: Painter): void;
}

export type SpriteCache = Record<MaterialName, HTMLCanvasElement>;

let sharedCache: SpriteCache | null = null;

export function spriteCache(): SpriteCache {
  if (sharedCache) return sharedCache;
  const cache = {} as SpriteCache;
  for (const name of Object.keys(MATERIALS) as MaterialName[]) {
    const c = document.createElement('canvas');
    c.width = SPRITE;
    c.height = SPRITE;
    c.getContext('2d')!.putImageData(new ImageData(cubeRGBA(MATERIALS[name]), SPRITE, SPRITE), 0, 0);
    cache[name] = c;
  }
  sharedCache = cache;
  return cache;
}

export interface PainterBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * 世界像素 → 畫布像素只差一個整數位移（且是 4 的倍數），
 * 所以網點在畫布上仍然對齊。
 */
export class Painter {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly ox: number;
  readonly oy: number;
  private sprites = spriteCache();

  constructor(bounds: PainterBounds, margin: { top: number; side: number; bottom: number }) {
    const snap = (v: number) => Math.ceil(v / 4) * 4;
    this.ox = snap(margin.side - bounds.minX);
    this.oy = snap(margin.top - bounds.minY);
    this.canvas = document.createElement('canvas');
    this.canvas.width = snap(bounds.maxX - bounds.minX + margin.side * 2);
    this.canvas.height = snap(bounds.maxY - bounds.minY + margin.top + margin.bottom);
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** 世界座標（體素）→ 畫布像素 */
  toCanvas(x: number, y: number, z: number): { cx: number; cy: number } {
    return { cx: (x - y) * 8 + this.ox, cy: (x + y) * 4 - z * 8 + this.oy };
  }

  cube(x: number, y: number, z: number, m: MaterialName, dy = 0): void {
    const o = spriteOrigin(x, y, z);
    this.ctx.drawImage(this.sprites[m], Math.round(o.sx + this.ox), Math.round(o.sy + this.oy + dy));
  }

  /** 畫布座標上的單一像素 */
  px(cx: number, cy: number, ink: InkName): void {
    this.ctx.fillStyle = INK_HEX[ink];
    this.ctx.fillRect(Math.round(cx), Math.round(cy), 1, 1);
  }

  rect(cx: number, cy: number, w: number, h: number, ink: InkName): void {
    this.ctx.fillStyle = INK_HEX[ink];
    this.ctx.fillRect(Math.round(cx), Math.round(cy), w, h);
  }

  /** 以網點填滿任意形狀：test 回傳 true 的像素依 level 上色 */
  dither(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    ink: InkName,
    level: number,
    test: (cx: number, cy: number) => boolean,
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = INK_HEX[ink];
    const ax = Math.max(0, Math.floor(x0));
    const ay = Math.max(0, Math.floor(y0));
    const bx = Math.min(this.canvas.width, Math.ceil(x1));
    const by = Math.min(this.canvas.height, Math.ceil(y1));
    for (let y = ay; y < by; y++)
      for (let x = ax; x < bx; x++) if (useSecond(level, x, y) && test(x + 0.5, y + 0.5)) ctx.fillRect(x, y, 1, 1);
  }

  /** 像素化的橢圓線（不做反鋸齒，放大後才不會糊） */
  ellipse(cx: number, cy: number, rx: number, ry: number, ink: InkName, dash = 0): void {
    this.ctx.fillStyle = INK_HEX[ink];
    const steps = Math.max(12, Math.ceil((rx + ry) * 2));
    for (let i = 0; i < steps; i++) {
      if (dash && Math.floor(i / dash) % 2) continue;
      const a = (i / steps) * Math.PI * 2;
      this.ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
    }
  }

  /**
   * 畫家演算法：靜態體素已排序，動態物件依 key 插入。
   * materialFor 可在繪製當下換材質（例如輸送帶的滾動條紋）。
   */
  scene(
    statics: readonly Voxel[],
    dynamics: Drawable[],
    materialFor?: (v: Voxel) => MaterialName,
    dropFor?: (v: Voxel) => number | null,
  ): void {
    dynamics.sort((a, b) => a.key - b.key);
    let j = 0;
    for (const v of statics) {
      const k = depthKey(v.x, v.y, v.z);
      while (j < dynamics.length && dynamics[j].key < k) dynamics[j++].draw(this);
      const dy = dropFor ? dropFor(v) : 0;
      if (dy === null) continue;
      this.cube(v.x, v.y, v.z, materialFor ? materialFor(v) : v.m, dy);
    }
    while (j < dynamics.length) dynamics[j++].draw(this);
  }
}

/** 小畫布靜態渲染（作品卡片的體素圖示用） */
export function renderModel(voxels: Voxel[], target: HTMLCanvasElement, pad = 4): void {
  const sorted = [...voxels].sort((a, b) => depthKey(a.x, a.y, a.z) - depthKey(b.x, b.y, b.z) || a.z - b.z || a.x - b.x);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const v of sorted) {
    const o = spriteOrigin(v.x, v.y, v.z);
    minX = Math.min(minX, o.sx);
    minY = Math.min(minY, o.sy);
    maxX = Math.max(maxX, o.sx + SPRITE);
    maxY = Math.max(maxY, o.sy + SPRITE);
  }
  const p = new Painter({ minX, minY, maxX, maxY }, { top: pad, side: pad, bottom: pad });
  p.scene(sorted, []);
  target.width = p.canvas.width;
  target.height = p.canvas.height;
  const ctx = target.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(p.canvas, 0, 0);
}
