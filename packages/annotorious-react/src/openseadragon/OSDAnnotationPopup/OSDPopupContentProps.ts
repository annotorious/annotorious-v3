import { ImageAnnotation } from '@annotorious/annotorious';

export interface OSDPopupProps {

  viewer: OpenSeadragon.Viewer;

  selection: ImageAnnotation[];

}