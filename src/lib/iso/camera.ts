// 捲動鏡頭：把捲動進度 p（0..1）換算成「現在在哪一章、鏡頭框哪裡」。純函式。

/** 世界像素中要框住的範圍 */
export interface Box {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** 畫面（CSS px）中可以放世界的區域 */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** screen = world * zoom + t */
export interface View {
  zoom: number;
  tx: number;
  ty: number;
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const easeInOutCubic = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * 兩個框之間插值。尺寸用幾何插值（縮放感覺才等速），
 * dip > 0 時中段會稍微拉遠，像鏡頭飛越。
 */
export function mixBox(a: Box, b: Box, t: number, dip = 0): Box {
  const lift = 1 + dip * Math.sin(Math.PI * t);
  return {
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    w: a.w * (b.w / a.w) ** t * lift,
    h: a.h * (b.h / a.h) ** t * lift,
  };
}

export function mixRegion(a: Region, b: Region, t: number): Region {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) };
}

/** 把框完整塞進區域並置中 */
export function fitView(box: Box, region: Region): View {
  const zoom = Math.min(region.w / box.w, region.h / box.h);
  return {
    zoom,
    tx: region.x + region.w / 2 - box.cx * zoom,
    ty: region.y + region.h / 2 - box.cy * zoom,
  };
}

export interface Phase {
  /** 飛過來花多少（以一個視窗高為單位） */
  travel: number;
  /** 抵達後停留多少 */
  hold: number;
}

export interface TourState {
  /** 目前（或正要抵達）的章節 */
  chapter: number;
  from: number;
  to: number;
  /** 飛行進度（已 ease），停留時為 1 */
  t: number;
  traveling: boolean;
  /** 停留段內的進度 0..1 */
  holdLocal: number;
}

export function totalLength(phases: readonly Phase[]): number {
  return phases.reduce((s, ph) => s + ph.travel + ph.hold, 0);
}

export function tourAt(p: number, phases: readonly Phase[]): TourState {
  let pos = clamp01(p) * totalLength(phases);
  for (let i = 0; i < phases.length; i++) {
    const { travel, hold } = phases[i];
    if (pos < travel) {
      return { chapter: i, from: Math.max(0, i - 1), to: i, t: easeInOutCubic(pos / travel), traveling: true, holdLocal: 0 };
    }
    pos -= travel;
    if (pos < hold || i === phases.length - 1) {
      return { chapter: i, from: i, to: i, t: 1, traveling: false, holdLocal: clamp01(pos / hold) };
    }
    pos -= hold;
  }
  // phases 為空時的保底
  return { chapter: 0, from: 0, to: 0, t: 1, traveling: false, holdLocal: 0 };
}

/** 第 i 章「剛抵達」時的捲動進度，給導覽點點跳轉用 */
export function arrivalP(i: number, phases: readonly Phase[]): number {
  const total = totalLength(phases);
  let pos = 0;
  for (let k = 0; k <= i && k < phases.length; k++) pos += phases[k].travel + (k < i ? phases[k].hold : 0);
  return total ? pos / total : 0;
}
