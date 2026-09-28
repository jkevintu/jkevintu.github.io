// 2:1 像素等角方塊的光柵化。純函式，不碰 DOM，方便單元測試。
import { INKS, fillAt, type InkName, type Material, type Rgb } from './palette';

/** sprite 尺寸：頂面菱形 16x8，側面高 8，總共 16x16 */
export const SPRITE = 16;

export type Face = 'top' | 'left' | 'right';

/**
 * 判斷 sprite 內某像素屬於哪個面。
 * 用像素中心點測試，|u| + 2|v - c| <= 9 會得到經典的 4/8/12/16 階梯菱形。
 */
export function faceAt(px: number, py: number): Face | null {
  if (px < 0 || py < 0 || px >= SPRITE || py >= SPRITE) return null;
  const u = px + 0.5 - 8;
  const v = py + 0.5;
  if (Math.abs(u) + 2 * Math.abs(v - 4) <= 9) return 'top';
  const inBody = v >= 4 && v <= 12;
  const inBottom = Math.abs(u) + 2 * Math.abs(v - 12) <= 9;
  if (!inBody && !inBottom) return null;
  return u < 0 ? 'left' : 'right';
}

// 面的遮罩只算一次
const FACE_MASK: (Face | null)[] = Array.from({ length: SPRITE * SPRITE }, (_, i) =>
  faceAt(i % SPRITE, Math.floor(i / SPRITE)),
);

export function faceMask(): readonly (Face | null)[] {
  return FACE_MASK;
}

/** 回傳 16x16 RGBA。ox/oy 是 sprite 在世界像素座標的原點，決定網點相位。 */
export function cubeRGBA(
  mat: Material,
  inks: Record<InkName, Rgb> = INKS,
  ox = 0,
  oy = 0,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(SPRITE * SPRITE * 4));
  for (let i = 0; i < FACE_MASK.length; i++) {
    const face = FACE_MASK[i];
    if (!face) continue;
    const px = i % SPRITE;
    const py = (i / SPRITE) | 0;
    const [r, g, b] = inks[fillAt(mat[face], px + ox, py + oy)];
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** 以「同一列、同一面」合併成橫條，拿來輸出精簡的 SVG（logo / favicon） */
export function faceRuns(): Array<{ x: number; y: number; w: number; face: Face }> {
  const runs: Array<{ x: number; y: number; w: number; face: Face }> = [];
  for (let y = 0; y < SPRITE; y++) {
    let x = 0;
    while (x < SPRITE) {
      const face = FACE_MASK[y * SPRITE + x];
      if (!face) {
        x++;
        continue;
      }
      const start = x;
      while (x < SPRITE && FACE_MASK[y * SPRITE + x] === face) x++;
      runs.push({ x: start, y, w: x - start, face });
    }
  }
  return runs;
}

/** 品牌方塊 SVG：黃頂、粉左、藍右 */
export function cubeSvg(colors: Record<Face, string>, size = 16): string {
  const rects = faceRuns()
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" fill="${colors[r.face]}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges">${rects}</svg>`;
}
