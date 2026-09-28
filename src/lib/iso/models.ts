// 作品卡片用的小體素模型，每個都站在一塊 5x5 草皮上。
import type { ModelId } from '../../data/content';
import { VoxelWorld, type Voxel } from './world';

function base(w: VoxelWorld): void {
  for (let x = 0; x <= 4; x++) for (let y = 0; y <= 4; y++) w.set(x, y, 0, (x + y) % 2 ? 'grass' : 'grassAlt');
  for (let x = 0; x <= 4; x++) for (let y = 0; y <= 4; y++) w.set(x, y, -1, 'rock');
}

const BUILDERS: Record<ModelId, (w: VoxelWorld) => void> = {
  antenna: (w) => {
    w.box(1, 1, 1, 3, 3, 1, 'blue');
    w.box(2, 2, 2, 2, 2, 5, 'ink');
    w.cylinder(2.5, 2.5, 1.6, 6, 6, 'paper');
    w.set(2, 2, 7, 'pink');
  },
  avatar: (w) => {
    w.box(1, 1, 1, 3, 3, 3, 'pink');
    w.set(1, 3, 2, 'ink').set(3, 3, 2, 'ink');
    w.box(1, 2, 4, 3, 2, 4, 'yellow');
    w.set(0, 2, 3, 'yellow').set(0, 2, 2, 'ink');
  },
  servers: (w) => {
    w.box(0, 1, 1, 1, 3, 4, 'blueDark');
    w.box(3, 1, 1, 4, 3, 3, 'blue');
    w.set(1, 3, 2, 'yellow').set(0, 3, 4, 'core').set(4, 3, 2, 'core').set(4, 2, 3, 'yellow');
  },
  funnel: (w) => {
    for (let x = 0; x <= 4; x++) for (let y = 0; y <= 4; y++) if (x === 0 || y === 0 || x === 4 || y === 4) w.set(x, y, 4, 'pink');
    for (let x = 1; x <= 3; x++) for (let y = 1; y <= 3; y++) if (x !== 2 || y !== 2) w.set(x, y, 3, 'pink');
    w.box(2, 2, 1, 2, 2, 2, 'ink');
    w.set(2, 2, 6, 'product').set(1, 3, 8, 'product');
  },
  phone: (w) => {
    w.box(1, 2, 1, 3, 3, 5, 'ink');
    w.box(1, 3, 2, 3, 3, 4, 'window');
    w.set(2, 3, 3, 'pink');
    w.set(4, 1, 6, 'pink').set(3, 1, 7, 'pink');
  },
  truck: (w) => {
    w.box(0, 1, 2, 3, 3, 4, 'paper');
    w.box(4, 1, 1, 4, 3, 3, 'pink');
    w.set(4, 2, 3, 'window');
    for (const x of [0, 3, 4]) w.set(x, 3, 1, 'ink');
  },
  speaker: (w) => {
    w.box(1, 1, 1, 3, 3, 4, 'ink');
    w.set(2, 3, 2, 'paper').set(2, 3, 4, 'paper').set(3, 2, 3, 'blue');
    w.box(4, 0, 5, 4, 0, 7, 'yellow');
    w.set(3, 0, 5, 'yellow');
  },
  cap: (w) => {
    w.box(1, 1, 1, 3, 3, 2, 'ink');
    w.box(0, 0, 3, 4, 4, 3, 'ink');
    w.set(2, 2, 4, 'yellow');
    w.box(4, 2, 1, 4, 2, 2, 'yellow');
  },
};

export function modelVoxels(id: ModelId): Voxel[] {
  const w = new VoxelWorld();
  base(w);
  BUILDERS[id](w);
  return w.visible();
}

export const MODEL_IDS = Object.keys(BUILDERS) as ModelId[];
