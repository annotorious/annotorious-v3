import { ImageAnnotation } from '@annotorious/annotorious';

export interface OSDPopupContentProps {

  viewer: OpenSeadragon.Viewer;

  selection: ImageAnnotation[];

}