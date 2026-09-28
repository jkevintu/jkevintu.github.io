// 真正的網點：點的大小隨濃度變化，網格可旋轉（仿 riso 的網屏角度）。
// build 時輸出成 SVG，當背景圖用；兩色網點疊在一起就是「網點撞」。
import { INK_HEX, type InkName } from './iso/palette';

export interface HalftoneSpec {
  ink: InkName;
  /** 濃度函式，輸入 0..1 的座標，回傳 0..1 */
  shape: 'corner' | 'linear' | 'even';
  /** 網屏角度（度） */
  angle: number;
  step: number;
  width: number;
  height: number;
}

export const HALFTONES: Record<string, HalftoneSpec> = {
  'corner-blue': { ink: 'blue', shape: 'corner', angle: 15, step: 12, width: 720, height: 720 },
  'corner-pink': { ink: 'pink', shape: 'corner', angle: 75, step: 12, width: 720, height: 720 },
  'corner-yellow': { ink: 'yellow', shape: 'corner', angle: 45, step: 12, width: 720, height: 720 },
  'linear-blue': { ink: 'blue', shape: 'linear', angle: 15, step: 10, width: 480, height: 360 },
  'linear-pink': { ink: 'pink', shape: 'linear', angle: 75, step: 10, width: 480, height: 360 },
  'linear-yellow': { ink: 'yellow', shape: 'linear', angle: 45, step: 10, width: 480, height: 360 },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function density(shape: HalftoneSpec['shape'], u: number, v: number): number {
  if (shape === 'even') return 0.25;
  if (shape === 'linear') return clamp01(1 - u * 1.15) ** 1.2;
  // 右上角最濃，往左下淡出
  const d = Math.hypot(1 - u, v) / Math.SQRT2;
  return clamp01(1 - d * 1.35) ** 1.1;
}

export interface Dot {
  x: number;
  y: number;
  r: number;
}

export function halftoneDots(spec: HalftoneSpec): Dot[] {
  const { width: W, height: H, step, angle, shape } = spec;
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const reach = Math.hypot(W, H);
  const dots: Dot[] = [];
  const maxR = step * 0.62;
  for (let i = -reach; i <= reach; i += step)
    for (let j = -reach; j <= reach; j += step) {
      const x = W / 2 + i * cos - j * sin;
      const y = H / 2 + i * sin + j * cos;
      if (x < -step || y < -step || x > W + step || y > H + step) continue;
      // 面積與濃度成正比 → 半徑取平方根
      const r = maxR * Math.sqrt(density(shape, x / W, y / H));
      if (r >= 0.45) dots.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +r.toFixed(2) });
    }
  return dots;
}

export function halftoneSvg(spec: HalftoneSpec): string {
  const body = halftoneDots(spec)
    .map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.width} ${spec.height}" preserveAspectRatio="none"><g fill="${INK_HEX[spec.ink]}">${body}</g></svg>`;
}
