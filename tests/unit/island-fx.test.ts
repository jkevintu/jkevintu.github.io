import { describe, expect, it } from 'vitest';
import { totalLength } from '../../src/lib/iso/camera';
import { ITEM_SPACING, hash01, itemPositions, stageAt } from '../../src/lib/iso/fx';
import {
  ANCHORS,
  BELT_Y,
  GATES,
  LEG1,
  PATH_LENGTH,
  SERVER_LEDS,
  STATIONS,
  TOUR_PHASES,
  WALK_Y,
  buildIsland,
  pointOnPath,
  rocketVoxels,
} from '../../src/lib/iso/island';

const island = buildIsland();

describe('island', () => {
  it('每次建出來都一樣（可重現）', () => {
    const again = buildIsland();
    expect(again.size).toBe(island.size);
    expect(again.sortedVisible().map((v) => `${v.x},${v.y},${v.z},${v.m}`)).toEqual(
      island.sortedVisible().map((v) => `${v.x},${v.y},${v.z},${v.m}`),
    );
  });

  it('剔除後的可見體素數量在效能預算內', () => {
    const n = island.sortedVisible().length;
    expect(n).toBeGreaterThan(1000);
    expect(n).toBeLessThan(6000);
  });

  it('五個站點都有對應 tag 的體素', () => {
    const tags = new Set(island.all().map((v) => v.tag));
    for (const s of STATIONS) expect(tags.has(s.id)).toBe(true);
  });

  it('物件路線上每一格都是輸送帶，而且上方淨空', () => {
    // s < 0.5 時物件還一半在進料機裡（刻意的「吐出來」效果）
    for (let s = 0.5; s <= PATH_LENGTH - 0.5; s += 0.25) {
      const { x, y } = pointOnPath(s);
      // 物件中心落在 2 格寬的帶子中間 → 左右兩格都要是輸送帶
      for (const [dx, dy] of [
        [-0.5, -0.5],
        [0.49, 0.49],
      ]) {
        const cx = Math.floor(x + dx);
        const cy = Math.floor(y + dy);
        const belt = island.get(cx, cy, 1);
        expect(belt?.m, `belt at ${cx},${cy}`).toMatch(/^belt/);
        // 物件高度（z=2）不可以撞到東西，除了閘門與建築的隧道頂
        expect(island.has(cx, cy, 2), `clear at ${cx},${cy}`).toBe(false);
      }
    }
  });

  it('路線是連續的：先 +x 再 -y', () => {
    expect(pointOnPath(0)).toEqual({ x: 4, y: BELT_Y + 1 });
    expect(pointOnPath(LEG1).y).toBe(BELT_Y + 1);
    expect(pointOnPath(LEG1 + 1).x).toBe(pointOnPath(LEG1).x);
    expect(pointOnPath(LEG1 + 1).y).toBe(BELT_Y);
  });

  it('小人走的路是 path 材質', () => {
    for (const s of STATIONS) expect(island.get(Math.floor(s.walkX), WALK_Y, 0)?.m).toBe('path');
  });

  it('伺服器指示燈都貼在機房正面', () => {
    for (const [x, z] of SERVER_LEDS) expect(island.get(x, 15, z)?.tag).toBe('core');
  });

  it('火箭的每一格都落在發射台上方的空位', () => {
    const [ax, ay, az] = ANCHORS.rocket;
    for (const v of rocketVoxels()) expect(island.has(ax + v.x, ay + v.y, az + v.z)).toBe(false);
    expect(island.get(ax, ay, az - 1)?.tag).toBe('launch');
  });

  it('導覽節奏：開場 + 五站', () => {
    expect(TOUR_PHASES).toHaveLength(STATIONS.length + 1);
    expect(TOUR_PHASES[0].travel).toBe(0);
    expect(totalLength(TOUR_PHASES)).toBeGreaterThan(4);
  });
});

describe('belt items', () => {
  it('物件永遠在路線上、彼此間距固定', () => {
    for (const t of [0, 1.3, 7.7, 123.4]) {
      const items = itemPositions(t);
      expect(items.length).toBeGreaterThan(4);
      for (const it of items) {
        expect(it.s).toBeGreaterThanOrEqual(0);
        expect(it.s).toBeLessThan(PATH_LENGTH);
        expect(pointOnPath(it.s)).toEqual({ x: it.x, y: it.y });
      }
      const sorted = items.map((i) => i.s).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i] - sorted[i - 1]).toBeCloseTo(ITEM_SPACING, 5);
      // 循環接縫（最後一個 → 第一個）也是同樣間距
      expect(sorted[0] + (PATH_LENGTH - 0.5) - sorted[sorted.length - 1]).toBeCloseTo(ITEM_SPACING, 5);
    }
  });

  it('越往後走升級越多：fuzzy → blueprint → wired → product', () => {
    const order = ['fuzzy', 'blueprint', 'wired', 'product'];
    let last = 0;
    for (let s = 0; s < PATH_LENGTH; s += 0.1) {
      const k = order.indexOf(stageAt(s));
      expect(k).toBeGreaterThanOrEqual(last);
      last = k;
    }
    expect(stageAt(0)).toBe('fuzzy');
    expect(stageAt(GATES.product - 4 + 0.01)).toBe('product');
    expect(stageAt(PATH_LENGTH - 0.1)).toBe('product');
  });

  it('hash01 落在 0..1', () => {
    for (let i = 0; i < 500; i++) {
      const h = hash01(i);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
  });
});
