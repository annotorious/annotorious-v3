import type { RectangleGeometry } from '@annotorious/annotorious';

export const parseMediaFragment = (
  fragmentOrSelector: string | { value: string },
  invertY = false
): RectangleGeometry => {
  const fragment =
    typeof fragmentOrSelector === 'string' ? fragmentOrSelector : fragmentOrSelector.value;

  const regex = /^(xywh)=(pixel|percent)?:?(.+?),(.+?),(.+?),(.+)*/g;

  const matches = [...fragment.matchAll(regex)][0];
  const [_, prefix, unit, a, b, c, d] = matches;

  if (prefix !== 'xywh') throw new Error('Unsupported MediaFragment: ' + fragment);

  if (unit && unit !== 'pixel') throw new Error(`Unsupported MediaFragment unit: ${unit}`);

  const [x, y, w, h] = [a, b, c, d].map(parseFloat);

  return {
    x,
    y,
    w,
    h,
    bounds: {
      minX: x,
      minY: invertY ? y - h : y,
      maxX: x + w,
      maxY: invertY ? y : y + h
    }
  };
};

export const toMediaFragmentSelector = (geometry: RectangleGeometry) => {
  const { x, y, w, h } = geometry;
  return {
    type: 'FragmentSelector',
    conformsTo: 'http://www.w3.org/TR/media-frags/',
    value: `xywh=pixel:${x},${y},${w},${h}`
  };
};
