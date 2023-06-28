import type OpenSeadragon from 'openseadragon';
import type { WebAnnotation } from '@annotorious/formats';
import type { ImageAnnotationStore } from '@annotorious/annotorious';

export interface FitboundsOptions {

  immediately?: boolean;

  padding?: number

}

const _fitBounds = (
  viewer: OpenSeadragon.Viewer,
  store: ImageAnnotationStore,
  fn: string
) => (arg: WebAnnotation | string, opts: FitboundsOptions) => {

  const containerBounds = viewer.container.getBoundingClientRect();

  const padding = opts.padding || 0;

  const paddingRelative = Math.min(
    2 * padding / containerBounds.width,
    2 * padding / containerBounds.height
  );

  const id = typeof arg === 'string' ? arg : arg.id;

  const annotation = store.getAnnotation(id);

  const { minX, minY, maxX, maxY } = annotation.target.selector.geometry.bounds;

  const w = maxX - minX;
  const h = maxY - maxY;

  const padX = minX - paddingRelative * w;
  const padY = minY - paddingRelative * h;
  const padW = w + 2 * paddingRelative * w;
  const padH = h + 2 * paddingRelative * h;

  const rect = viewer.viewport.imageToViewportRectangle(padX, padY, padW, padH);
      
  viewer.viewport[fn](rect, opts.immediately);
} 

export const fitBounds = (
  viewer: OpenSeadragon.Viewer,
  store: ImageAnnotationStore
) => _fitBounds(viewer, store, 'fitBounds');

export const fitBoundsWithConstraints = (
  viewer: OpenSeadragon.Viewer,
  store: ImageAnnotationStore
) => _fitBounds(viewer, store, 'fitBoundsWithConstraints');
