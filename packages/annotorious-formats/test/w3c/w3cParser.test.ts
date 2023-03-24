import { describe, it, expect } from 'vitest';
import { ShapeType } from '@annotorious/annotorious';
import { parseW3C } from '../../src/w3c';

import { Annotations } from './fixtures';

describe('parseW3C', () => {
  it('should parse the sample annotations correctly', () => {
    const { parsed, failed } = parseW3C(Annotations);

    expect(parsed.length).toBe(Annotations.length);
    expect(failed.length).toBe(0);

    const [polygon, rectangle] = parsed;

    expect(polygon.target.selector.type).toBe(ShapeType.POLYGON);
    expect(rectangle.target.selector.type).toBe(ShapeType.RECTANGLE);
  });
});
