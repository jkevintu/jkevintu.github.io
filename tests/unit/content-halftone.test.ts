import { describe, expect, it } from 'vitest';
import { BUILDS, CHAPTERS, QUOTES, SITE, STATS, WORLDS } from '../../src/data/content';
import { HALFTONES, density, halftoneDots, halftoneSvg } from '../../src/lib/halftone';
import { STATIONS } from '../../src/lib/iso/island';
import { MODEL_IDS, modelVoxels } from '../../src/lib/iso/models';

describe('content', () => {
  it('章節與島上站點一一對應、順序一致', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(STATIONS.map((s) => s.id));
    CHAPTERS.forEach((c, i) => expect(c.stage).toBe(String(i + 1).padStart(2, '0')));
  });

  it('每個作品都有體素模型與必要欄位', () => {
    expect(BUILDS.length % 4).toBe(0); // 4 欄格線剛好排滿
    for (const b of BUILDS) {
      expect(MODEL_IDS).toContain(b.model);
      expect(b.title.length).toBeGreaterThan(2);
      expect(b.body.length).toBeGreaterThan(40);
      expect(b.tags.length).toBeGreaterThan(0);
    }
  });

  it('經歷等級從 10 倒數到 01、不重複', () => {
    const lv = WORLDS.flatMap((w) => w.levels.map((l) => l.lv));
    expect(lv).toEqual(['10', '09', '08', '07', '06', '05', '04', '03', '02', '01']);
  });

  it('連結與信箱格式正確', () => {
    expect(SITE.email).toMatch(/^[^@\s]+@jkevintu\.com$/);
    for (const url of Object.values(SITE.links)) expect(url).toMatch(/^https:\/\//);
  });

  it('數字與推薦都有值', () => {
    expect(STATS).toHaveLength(4);
    for (const q of QUOTES) expect(q.name && q.role && q.text).toBeTruthy();
  });

  it('每個模型都至少有底座以上的內容', () => {
    for (const id of MODEL_IDS) expect(modelVoxels(id).some((v) => v.z >= 1)).toBe(true);
  });
});

describe('halftone', () => {
  it('濃度在 0..1，角落最濃', () => {
    for (const shape of ['corner', 'linear', 'even'] as const)
      for (let u = 0; u <= 1; u += 0.25)
        for (let v = 0; v <= 1; v += 0.25) {
          const d = density(shape, u, v);
          expect(d).toBeGreaterThanOrEqual(0);
          expect(d).toBeLessThanOrEqual(1);
        }
    expect(density('corner', 1, 0)).toBeGreaterThan(density('corner', 0, 1));
    expect(density('linear', 0, 0.5)).toBeGreaterThan(density('linear', 0.8, 0.5));
  });

  it('點都在畫布附近、半徑不超過網格', () => {
    for (const spec of Object.values(HALFTONES)) {
      const dots = halftoneDots(spec);
      expect(dots.length).toBeGreaterThan(50);
      for (const d of dots) {
        expect(d.x).toBeGreaterThan(-spec.step * 2);
        expect(d.y).toBeLessThan(spec.height + spec.step * 2);
        expect(d.r).toBeLessThanOrEqual(spec.step * 0.62);
      }
    }
  });

  it('輸出合法 SVG、檔案大小合理', () => {
    const svg = halftoneSvg(HALFTONES['corner-blue']);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.length).toBeLessThan(200_000);
  });
});
