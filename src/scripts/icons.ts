// 作品卡片：把體素小模型畫進 canvas[data-model]
import type { ModelId } from '../data/content';
import { modelVoxels } from '../lib/iso/models';
import { renderModel } from '../lib/iso/render';

export function initIcons(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLCanvasElement>('canvas[data-model]').forEach((c) => {
    renderModel(modelVoxels(c.dataset.model as ModelId), c, 6);
    c.dataset.ready = 'true';
  });
}
