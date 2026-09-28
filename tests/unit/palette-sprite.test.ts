import { describe, expect, it } from 'vitest';
import { INKS, INK_HEX, MATERIALS, fillAt, useSecond } from '../../src/lib/iso/palette';
import { SPRITE, cubeRGBA, cubeSvg, faceAt, faceMask, faceRuns } from '../../src/lib/iso/sprite';

describe('palette', () => {
  it('Bayer 網點：level 0 全 a、level 16 全 b、level 8 剛好一半', () => {
    const count = (level: number) => {
      let n = 0;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (useSecond(level, x, y)) n++;
      return n;
    };
    expect(count(0)).toBe(0);
    expect(count(16)).toBe(16);
    expect(count(8)).toBe(8);
    for (let l = 0; l <= 16; l++) expect(count(l)).toBe(l);
  });

  it('網點以 4px 週期重複（負座標也一樣），sprite 跨格才能對齊', () => {
    for (let y = -8; y < 8; y++)
      for (let x = -8; x < 8; x++) expect(useSecond(7, x, y)).toBe(useSecond(7, x + 4, y + 8));
  });

  it('每個材質的每一面都只用色票裡的顏色', () => {
    for (const mat of Object.values(MATERIALS))
      for (const fill of [mat.top, mat.left, mat.right]) {
        expect(INKS[fill.a]).toBeDefined();
        if (fill.b) expect(INKS[fill.b]).toBeDefined();
        expect(fill.level ?? 0).toBeGreaterThanOrEqual(0);
        expect(fill.level ?? 0).toBeLessThanOrEqual(16);
      }
  });

  it('fillAt 在沒有第二色時永遠回傳主色', () => {
    expect(fillAt({ a: 'pink' }, 3, 5)).toBe('pink');
  });

  it('INK_HEX 與 CSS 色票一致（三色油墨）', () => {
    expect(INK_HEX.blue).toBe('#304ffe');
    expect(INK_HEX.pink).toBe('#ff3e86');
    expect(INK_HEX.yellow).toBe('#ffcf33');
  });
});

describe('cube sprite', () => {
  it('頂面是 4/8/12/16/16/12/8/4 的 2:1 階梯菱形', () => {
    const widths = Array.from({ length: 8 }, (_, y) => Array.from({ length: SPRITE }, (_, x) => faceAt(x, y)).filter((f) => f === 'top').length);
    expect(widths).toEqual([4, 8, 12, 16, 16, 12, 8, 4]);
  });

  it('左右兩面各佔一半且側面高 8px', () => {
    const col = (x: number) => Array.from({ length: SPRITE }, (_, y) => faceAt(x, y));
    expect(col(0).filter((f) => f === 'left')).toHaveLength(8);
    expect(col(15).filter((f) => f === 'right')).toHaveLength(8);
    expect(col(7).filter((f) => f === 'left')).toHaveLength(8);
    expect(col(8).filter((f) => f === 'right')).toHaveLength(8);
  });

  it('左右對稱', () => {
    for (let y = 0; y < SPRITE; y++)
      for (let x = 0; x < 8; x++) {
        const a = faceAt(x, y);
        const b = faceAt(15 - x, y);
        expect(a === null).toBe(b === null);
      }
  });

  it('界外回傳 null', () => {
    expect(faceAt(-1, 0)).toBeNull();
    expect(faceAt(16, 4)).toBeNull();
  });

  it('cubeRGBA 只在方塊輪廓內不透明', () => {
    const px = cubeRGBA(MATERIALS.product);
    const mask = faceMask();
    for (let i = 0; i < mask.length; i++) expect(px[i * 4 + 3]).toBe(mask[i] ? 255 : 0);
    // product：頂黃、左粉、右藍
    const at = (x: number, y: number) => [...px.slice((y * 16 + x) * 4, (y * 16 + x) * 4 + 3)];
    expect(at(8, 3)).toEqual([...INKS.yellow]);
    expect(at(1, 8)).toEqual([...INKS.pink]);
    expect(at(14, 8)).toEqual([...INKS.blue]);
  });

  it('faceRuns 合併後像素數與遮罩相同，SVG 可用', () => {
    const total = faceRuns().reduce((s, r) => s + r.w, 0);
    expect(total).toBe(faceMask().filter(Boolean).length);
    const svg = cubeSvg({ top: '#ff0', left: '#f0f', right: '#00f' }, 32);
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 16 16"/);
    expect(svg.match(/<rect/g)?.length).toBe(faceRuns().length);
  });
});
