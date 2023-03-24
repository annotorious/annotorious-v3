import { describe, it, expect } from 'vitest';
import { parseMediaFragment } from '../../src/mediafragments';

describe('MediaFragment', () => {
  it('should parse a fragment with pixel unit correctly', () => {
    const fragment = 'xywh=pixel:160,120,320,240';
    const { x, y, w, h, bounds } = parseMediaFragment(fragment);

    expect(x).toBe(160);
    expect(y).toBe(120);
    expect(w).toBe(320);
    expect(h).toBe(240);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(360);
  });

  it('should parse a fragment without unit as pixel fragment', () => {
    const fragment = 'xywh=160,120,320,240';
    const { x, y, w, h, bounds } = parseMediaFragment(fragment);

    expect(x).toBe(160);
    expect(y).toBe(120);
    expect(w).toBe(320);
    expect(h).toBe(240);

    expect(bounds.minX).toBe(160);
    expect(bounds.minY).toBe(120);
    expect(bounds.maxX).toBe(480);
    expect(bounds.maxY).toBe(360);
  });

  it('should fail for a fragment with percent unit', () => {
    const fragment = 'xywh=percent:25,25,50,50';

    try {
      parseMediaFragment(fragment);
    } catch (error) {
      expect(error.message).toBe('Unsupported MediaFragment unit: percent');
    }
  });
});
