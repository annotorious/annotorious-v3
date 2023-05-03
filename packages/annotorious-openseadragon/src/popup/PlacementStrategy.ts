import type { ImageAnnotation } from '@annotorious/annotorious';

export type PlacementStrategy = (

  // the selected annotation
  annotation: ImageAnnotation,

  // pointer event that triggered the selection
  event: PointerEvent

) => [top: number, left: number];

export const defaultStrategy: PlacementStrategy = (annotation: ImageAnnotation, event: PointerEvent) => {
  const { offsetX, offsetY } = event;
  return [offsetX, offsetY];
}

