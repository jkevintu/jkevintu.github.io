// Now Playing：像素化的語音波形（三色油墨輪流）
import { INK_HEX, useSecond, type InkName } from '../lib/iso/palette';

export function initWave(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const inks: InkName[] = ['pink', 'yellow', 'blue'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = false;

  const draw = (t: number) => {
    ctx.clearRect(0, 0, W, H);
    const bars = Math.floor(W / 4);
    for (let i = 0; i < bars; i++) {
      // 幾個正弦疊起來，像講話時的音量起伏
      const env = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + i * 0.07));
      const v = Math.abs(Math.sin(t * 5 + i * 0.5) * 0.6 + Math.sin(t * 3.1 + i * 0.23) * 0.4);
      const h = Math.max(2, Math.round(v * env * (H / 2 - 2)));
      const ink = inks[Math.floor(i / 6) % 3];
      for (let y = -h; y <= h; y++) {
        const edge = Math.abs(y) > h - 3;
        for (let x = 0; x < 3; x++) {
          const px = i * 4 + x;
          const py = H / 2 + y;
          if (edge && !useSecond(10, px, py)) continue;
          ctx.fillStyle = INK_HEX[ink];
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  };

  const loop = (ms: number) => {
    draw(ms / 1000);
    if (visible && !reduced) requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    const was = visible;
    visible = e.isIntersecting;
    if (visible && !was) requestAnimationFrame(loop);
  }).observe(canvas);
  draw(1.7);
}
