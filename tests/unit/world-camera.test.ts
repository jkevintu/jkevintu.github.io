import { describe, expect, it } from 'vitest';
import { arrivalP, easeInOutCubic, fitView, mixBox, tourAt, totalLength, type Phase } from '../../src/lib/iso/camera';
import { VoxelWorld, compareVoxels, depthKey, project, rng, screenBounds, spriteOrigin } from '../../src/lib/iso/world';

describe('projection', () => {
  it('x 往右下、y 往左下、z 往上', () => {
    const o = project(0, 0, 0);
    expect(project(1, 0, 0)).toEqual({ sx: o.sx + 8, sy: o.sy + 4 });
    expect(project(0, 1, 0)).toEqual({ sx: o.sx - 8, sy: o.sy + 4 });
    expect(project(0, 0, 1)).toEqual({ sx: o.sx, sy: o.sy - 8 });
  });

  it('sprite 原點永遠落在 4 的倍數上（網點不會錯位）', () => {
    for (let x = -3; x < 5; x++)
      for (let y = -3; y < 5; y++)
        for (let z = -3; z < 5; z++) {
          const o = spriteOrigin(x, y, z);
          expect(((o.sx % 4) + 4) % 4).toBe(0);
          expect(((o.sy % 4) + 4) % 4).toBe(0);
        }
  });
});

describe('VoxelWorld', () => {
  it('box 含頭含尾、carve 會挖掉', () => {
    const w = new VoxelWorld().box(0, 0, 0, 2, 1, 0, 'blue');
    expect(w.size).toBe(6);
    w.carve(1, 0, 0, 1, 1, 0);
    expect(w.size).toBe(4);
    expect(w.has(1, 0, 0)).toBe(false);
  });

  it('後設定的材質覆蓋先前的', () => {
    const w = new VoxelWorld().set(0, 0, 0, 'blue').set(0, 0, 0, 'pink', 'x');
    expect(w.get(0, 0, 0)).toMatchObject({ m: 'pink', tag: 'x' });
  });

  it('cylinder 以半格圓心產生對稱的圓', () => {
    const w = new VoxelWorld().cylinder(1.5, 1.5, 1.5, 0, 0, 'blue');
    expect(w.size).toBe(9);
  });

  it('visible() 剔除被三面包住的體素', () => {
    const w = new VoxelWorld().box(0, 0, 0, 2, 2, 2, 'blue');
    const vis = w.visible();
    expect(vis.some((v) => v.x === 0 && v.y === 0 && v.z === 0)).toBe(false);
    expect(vis.some((v) => v.x === 2 && v.y === 2 && v.z === 2)).toBe(true);
    expect(vis.length).toBe(27 - 8);
  });

  it('排序：前面（座標和大）的後畫', () => {
    const w = new VoxelWorld().set(1, 1, 1, 'blue').set(0, 0, 0, 'pink').set(1, 0, 0, 'ink');
    const keys = w.sortedVisible().map((v) => depthKey(v.x, v.y, v.z));
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(compareVoxels({ x: 0, y: 0, z: 1, m: 'ink' }, { x: 1, y: 0, z: 0, m: 'ink' })).toBeGreaterThan(0);
  });

  it('screenBounds 包住所有 sprite', () => {
    const w = new VoxelWorld().box(0, 0, 0, 3, 3, 3, 'blue');
    const b = screenBounds(w.all());
    for (const v of w.all()) {
      const o = spriteOrigin(v.x, v.y, v.z);
      expect(o.sx).toBeGreaterThanOrEqual(b.minX);
      expect(o.sy + 16).toBeLessThanOrEqual(b.maxY);
    }
  });

  it('rng 可重現', () => {
    const a = rng(42);
    const b = rng(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
});

describe('camera', () => {
  const phases: Phase[] = [
    { travel: 0, hold: 1 },
    { travel: 1, hold: 1 },
    { travel: 1, hold: 2 },
  ];

  it('ease 端點固定', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('mixBox 端點等於兩端，尺寸為幾何插值，dip 只影響中段', () => {
    const a = { cx: 0, cy: 0, w: 100, h: 100 };
    const b = { cx: 100, cy: 50, w: 400, h: 400 };
    expect(mixBox(a, b, 0, 0.3)).toEqual(a);
    expect(mixBox(a, b, 1, 0.3).w).toBeCloseTo(400);
    expect(mixBox(a, b, 0.5).w).toBeCloseTo(200);
    expect(mixBox(a, b, 0.5, 0.3).w).toBeCloseTo(260);
  });

  it('fitView 把框完整放進區域並置中', () => {
    const v = fitView({ cx: 50, cy: 50, w: 100, h: 50 }, { x: 0, y: 0, w: 400, h: 400 });
    expect(v.zoom).toBe(4);
    expect(50 * v.zoom + v.tx).toBe(200);
    expect(50 * v.zoom + v.ty).toBe(200);
  });

  it('tourAt：開場停留 → 飛行 → 停留，最後一章夾住', () => {
    expect(totalLength(phases)).toBe(6);
    expect(tourAt(0, phases)).toMatchObject({ chapter: 0, traveling: false });
    expect(tourAt(1.5 / 6, phases)).toMatchObject({ chapter: 1, from: 0, to: 1, traveling: true });
    expect(tourAt(2.5 / 6, phases)).toMatchObject({ chapter: 1, traveling: false });
    expect(tourAt(1, phases)).toMatchObject({ chapter: 2, traveling: false, holdLocal: 1 });
    expect(tourAt(2, phases).chapter).toBe(2);
    expect(tourAt(-1, phases).chapter).toBe(0);
  });

  it('arrivalP 對應到剛抵達的那一刻', () => {
    for (let i = 0; i < phases.length; i++) {
      const s = tourAt(arrivalP(i, phases) + 1e-6, phases);
      expect(s.chapter).toBe(i);
      expect(s.traveling).toBe(false);
    }
  });
});
