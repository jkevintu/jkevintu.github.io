// 首頁導覽：捲動 → 鏡頭 → 章節文字。canvas 只是加分，文字永遠在 HTML 裡。
import {
  arrivalP,
  clamp01,
  fitView,
  lerp,
  mixBox,
  mixRegion,
  tourAt,
  type Box,
  type Region,
  type View,
} from '../lib/iso/camera';
import * as fx from '../lib/iso/fx';
import { BELT_Y, STATIONS, TOUR_PHASES as PHASES, buildIsland, type StationId } from '../lib/iso/island';
import type { MaterialName } from '../lib/iso/palette';
import { Painter, type Drawable } from '../lib/iso/render';
import { screenBounds, spriteOrigin, type Voxel } from '../lib/iso/world';

interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function initTour(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const label = root.querySelector<HTMLElement>('[data-hover-label]')!;
  const progress = root.querySelector<HTMLElement>('[data-progress]');
  const pips = [...root.querySelectorAll<HTMLButtonElement>('[data-pip]')];
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const world = buildIsland();
  const statics = world.sortedVisible();
  const painter = new Painter(screenBounds(statics), { top: 150, side: 48, bottom: 40 });

  // 站點命中框（畫布座標）
  const boxes = new Map<StationId, BBox>();
  for (const v of statics) {
    if (!v.tag) continue;
    const o = spriteOrigin(v.x, v.y, v.z);
    const b = boxes.get(v.tag as StationId) ?? { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    b.x0 = Math.min(b.x0, o.sx + painter.ox);
    b.y0 = Math.min(b.y0, o.sy + painter.oy);
    b.x1 = Math.max(b.x1, o.sx + painter.ox + 16);
    b.y1 = Math.max(b.y1, o.sy + painter.oy + 16);
    boxes.set(v.tag as StationId, b);
  }

  const island = screenBounds(statics);
  const keyBoxes: Box[] = [
    {
      cx: (island.minX + island.maxX) / 2 + painter.ox,
      cy: (island.minY + island.maxY) / 2 + painter.oy - 10,
      w: island.maxX - island.minX + 24,
      h: island.maxY - island.minY + 60,
    },
    ...STATIONS.map((s) => {
      const c = painter.toCanvas(...s.focus);
      return { cx: c.cx, cy: c.cy, w: s.view[0], h: s.view[1] };
    }),
  ];

  let W = 0;
  let H = 0;
  let dpr = 1;
  let wide = true;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = stage.clientWidth;
    H = stage.clientHeight;
    wide = W >= 900;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    dirty = true;
  };

  const boxFor = (i: number): Box => (wide && i > 0 ? { ...keyBoxes[i], w: keyBoxes[i].w * 1.3, h: keyBoxes[i].h * 1.3 } : keyBoxes[i]);

  const regionFor = (chapter: number): Region => {
    if (wide) return chapter === 0 ? { x: W * 0.46, y: H * 0.14, w: W * 0.52, h: H * 0.8 } : { x: W * 0.42, y: H * 0.1, w: W * 0.54, h: H * 0.84 };
    return chapter === 0 ? { x: 8, y: H * 0.6, w: W - 16, h: H * 0.34 } : { x: 0, y: H * 0.1, w: W, h: H * 0.48 };
  };

  // 捲動狀態
  let p = 0;
  let dirty = true;
  let pointer = { x: 0, y: 0 };
  let hovered: StationId | null = null;
  let view: View = { zoom: 1, tx: 0, ty: 0 };
  const walker: fx.Walker = { x: 2, walking: false, facing: 1 };
  let launch = 0;
  let focused: StationId | null = null;

  const scrollable = () => Math.max(1, root.offsetHeight - innerHeight);
  const readScroll = () => {
    const next = clamp01(-root.getBoundingClientRect().top / scrollable());
    if (next !== p) {
      p = next;
      dirty = true;
    }
  };

  const goTo = (chapter: number) => {
    const top = root.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (arrivalP(chapter, PHASES) + 0.004) * scrollable(), behavior: reduced ? 'auto' : 'smooth' });
  };
  pips.forEach((pip) => pip.addEventListener('click', () => goTo(Number(pip.dataset.pip))));

  let currentPip = -1;
  const setData = (key: string, value: string) => {
    if (stage.dataset[key] !== value) stage.dataset[key] = value;
  };

  const update = () => {
    const s = tourAt(p, PHASES);
    // 鏡頭
    let box = s.traveling ? mixBox(boxFor(s.from), boxFor(s.to), s.t, s.from === s.to ? 0 : 0.28) : boxFor(s.chapter);
    launch = s.chapter === PHASES.length - 1 && !s.traveling ? clamp01((s.holdLocal - 0.1) / 0.8) : 0;
    if (launch > 0) {
      // 鏡頭往上跟著火箭，並拉遠到火箭與發射台都在畫面內
      const lift = launch * launch * fx.ROCKET_LIFT * 8;
      const h = Math.max(box.h * (1 + launch * 0.8), lift + 170);
      box = { ...box, cy: box.cy - lift * 0.5, w: box.w * (h / box.h), h };
    }
    const region = s.traveling ? mixRegion(regionFor(s.from), regionFor(s.to), s.t) : regionFor(s.chapter);
    view = fitView(box, region);
    if (wide && !reduced) {
      view.tx += (pointer.x - 0.5) * -14;
      view.ty += (pointer.y - 0.5) * -10;
    }
    // 小人
    const walkAt = (c: number) => (c === 0 ? 2 : STATIONS[c - 1].walkX);
    const nx = s.traveling ? lerp(walkAt(s.from), walkAt(s.to), s.t) : walkAt(s.chapter);
    walker.walking = s.traveling && s.t > 0.02 && s.t < 0.98;
    if (Math.abs(nx - walker.x) > 0.001) walker.facing = nx > walker.x ? 1 : -1;
    walker.x = nx;
    // 文字與 HUD
    const active = !s.traveling || s.t > 0.82 ? s.chapter : -1;
    focused = active > 0 && launch < 0.25 ? STATIONS[active - 1].id : null;
    // 只在值改變時才碰 DOM，避免每一幀都觸發樣式重算
    setData('chapter', String(active));
    setData('intro', String(s.chapter === 0 || (s.chapter === 1 && s.traveling && s.t < 0.3)));
    if (s.chapter !== currentPip) {
      currentPip = s.chapter;
      pips.forEach((pip) => pip.toggleAttribute('aria-current', Number(pip.dataset.pip) === s.chapter));
    }
    if (progress) progress.style.transform = `scaleX(${p.toFixed(4)})`;
  };

  // 開場：體素一格一格掉下來
  let introStart = -1;
  const dropFor = (now: number) =>
    reduced || introStart < 0
      ? undefined
      : (v: Voxel): number | null => {
          const local = (now - introStart - (v.x + v.y) * 0.02 - (v.z + 10) * 0.004) / 0.5;
          if (local <= 0) return null;
          if (local >= 1) return 0;
          const back = 1 + 2.2 * (local - 1) ** 3 + 1.2 * (local - 1) ** 2;
          return -(1 - back) * 50;
        };

  const beltFor =
    (now: number) =>
    (v: Voxel): MaterialName =>
      v.m === 'beltA' || v.m === 'beltB'
        ? (((v.y < BELT_Y ? -v.y : v.x) + Math.floor(now * fx.ITEM_SPEED * 2)) % 2 + 2) % 2
          ? 'beltA'
          : 'beltB'
        : v.m;

  const draw = (now: number) => {
    const t = reduced ? 3.3 : now;
    painter.clear();
    fx.skyClouds(painter, t);
    const dyn: Drawable[] = [
      ...fx.items(t),
      ...fx.coreCube(t),
      ...fx.press(t),
      ...fx.serverLeds(t),
      ...fx.rocket(launch),
      fx.avatar(walker, t),
    ];
    const drop = dropFor(now);
    painter.scene(statics, dyn, beltFor(t), drop);
    const introDone = !drop || now - introStart > 2.2;
    if (introDone) {
      fx.fogRain(painter, t);
      fx.lighthouseBeam(painter, t);
      fx.dishWaves(painter, t);
      fx.chimneySmoke(painter, t);
      fx.pressSparks(painter, t);
      fx.peakFlag(painter, t);
      fx.avatarTag(painter, walker, t);
    }
    fx.rocketExhaust(painter, launch, t);
    const target = hovered ?? focused;
    const tb = target ? boxes.get(target) : undefined;
    if (tb) fx.reticle(painter, tb, t);
    placeLabel(target);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      painter.canvas,
      Math.round(view.tx * dpr),
      Math.round(view.ty * dpr),
      Math.round(painter.canvas.width * view.zoom * dpr),
      Math.round(painter.canvas.height * view.zoom * dpr),
    );
  };

  // hover / click 站點
  const hitTest = (clientX: number, clientY: number): StationId | null => {
    const r = canvas.getBoundingClientRect();
    const nx = (clientX - r.left - view.tx) / view.zoom;
    const ny = (clientY - r.top - view.ty) / view.zoom;
    let best: StationId | null = null;
    let bestArea = Infinity;
    for (const [id, b] of boxes) {
      if (nx < b.x0 || nx > b.x1 || ny < b.y0 || ny > b.y1) continue;
      const area = (b.x1 - b.x0) * (b.y1 - b.y0);
      if (area < bestArea) {
        best = id;
        bestArea = area;
      }
    }
    return best;
  };

  function placeLabel(id: StationId | null): void {
    label.hidden = !id;
    if (!id) return;
    const idx = STATIONS.findIndex((s) => s.id === id);
    const text = `${String(idx + 1).padStart(2, '0')} · ${pips[idx]?.dataset.name ?? id}`;
    if (label.textContent !== text) label.textContent = text;
    const b = boxes.get(id)!;
    label.style.transform = `translate(${Math.round(((b.x0 + b.x1) / 2) * view.zoom + view.tx)}px, ${Math.round(b.y0 * view.zoom + view.ty - 14)}px)`;
  }

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    const hit = e.pointerType === 'mouse' ? hitTest(e.clientX, e.clientY) : null;
    if (hit !== hovered) {
      hovered = hit;
      canvas.style.cursor = hit ? 'pointer' : '';
    }
    dirty = true;
    kick();
  });
  canvas.addEventListener('pointerleave', () => {
    hovered = null;
    canvas.style.cursor = '';
    dirty = true;
    kick();
  });
  canvas.addEventListener('click', (e) => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) goTo(STATIONS.findIndex((s) => s.id === hit) + 1);
  });

  // 迴圈：只在畫面內才跑；減少動態模式下只在捲動時重畫
  let visible = true;
  let raf = 0;
  const frame = (ms: number) => {
    raf = 0;
    const now = ms / 1000;
    if (introStart < 0) introStart = now;
    readScroll();
    if (dirty || !reduced) {
      update();
      draw(now);
      dirty = false;
      setData('ready', 'true');
    }
    if (visible && !reduced) raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  }).observe(root);
  addEventListener('scroll', () => reduced && kick(), { passive: true });
  addEventListener('resize', () => {
    resize();
    kick();
  });
  resize();
  kick();
}
