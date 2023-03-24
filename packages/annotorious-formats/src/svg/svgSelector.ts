import { boundsFromPoints, ShapeType } from '@annotorious/annotorious';
import type { Bounds, PolygonGeometry, Shape } from '@annotorious/annotorious';

interface SVGGeometry {

  type: ShapeType;

  geometry: {
    [key: string]: any;

    bounds: Bounds;
  };

}

interface SVGSelector {

  type: 'SvgSelector';

  value: string;
  
}

export const parseSVG = (valueOrSelector: string | { value: string }): SVGGeometry => {
  const value = typeof valueOrSelector === 'string' ? valueOrSelector : valueOrSelector.value;

  // TODO hack for testing - need to port the original Annotorious code for this
  const [a, b, str] = value.match(/(<polygon points=")([^"]*)/) || [];

  if (!str) return;

  const points = str.split(' ').map((p) => p.split(',').map(parseFloat));

  return {
    type: ShapeType.POLYGON,
    geometry: {
      points,
      bounds: boundsFromPoints(points as [number, number][])
    }
  };
};

export const toSVGSelector = (shape: Shape): SVGSelector => {
  let value: string;

  if (shape.type === ShapeType.POLYGON) {
    const geom = shape.geometry as PolygonGeometry;
    const { points } = geom;
    value = `<polygon points="${points.map((xy) => xy.join(',')).join(' ')}" />`;
  }

  if (value) {
    return { type: 'SvgSelector', value };
  } else {
    throw `Unsupported shape type: ${shape.type}`;
  }
};
