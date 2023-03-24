import type { ImageAnnotation } from '@annotorious/annotorious';

export interface PixiLayerClickEvent {
  
  originalEvent: PointerEvent;
  
  annotation?: ImageAnnotation;

}