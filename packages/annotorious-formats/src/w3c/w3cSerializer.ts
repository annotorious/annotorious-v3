import { ShapeType, type ImageAnnotation, type RectangleGeometry } from '@annotorious/annotorious';
import { toSVGSelector, toMediaFragmentSelector } from '..';
import type { WebAnnotation } from './WebAnnotation';

export const serializeW3C = (annotation: ImageAnnotation, source: string): WebAnnotation => {
  const shape = annotation.target.selector;

  const selector =
    shape.type == ShapeType.RECTANGLE
      ? toMediaFragmentSelector(shape.geometry as RectangleGeometry)
      : toSVGSelector(shape);

  return {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: annotation.id,
    type: 'Annotation',
    body: annotation.bodies,
    target: {
      source,
      selector
    }
  };
};
