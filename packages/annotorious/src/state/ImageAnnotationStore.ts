import RBush from 'rbush';
import { createHighlightState, createHoverState, createLifecyleObserver, createSelectionState, createStore } from '@annotorious/core';
import { ShapeType, computeArea, intersects } from '../model';
import type { ImageAnnotation, ImageAnnotationTarget } from '../model';
import type { AnnotoriousOptions } from '../AnnotoriousOptions';

interface IndexedTarget {

  minX: number;

  minY: number;

  maxX: number;

  maxY: number;

  target: ImageAnnotationTarget;

}

const createSpatialTree = () => {

  const tree = new RBush<IndexedTarget>();

  const all = () => tree.all().map(item => item.target);

  const clear = () => tree.clear();

  const insert = (target: ImageAnnotationTarget) => {
    const { minX, minY, maxX, maxY } = target.selector.geometry.bounds;
    tree.insert({ minX, minY, maxX, maxY, target });
  };

  const remove = (target: ImageAnnotationTarget) => {
    const item = {
      ...target.selector.geometry.bounds,
      target
    };

    tree.remove(item, (a, b) => a.target.annotation === b.target.annotation);
  };

  const update = (previous: ImageAnnotationTarget, updated: ImageAnnotationTarget) => {
    remove(previous);
    insert(updated);
  };

  const set = (targets: ImageAnnotationTarget[], replace: boolean = true) => {
    if (replace) tree.clear();

    tree.load(
      targets.map(target => {
        const { minX, minY, maxX, maxY } = target.selector.geometry.bounds;
        return { minX, minY, maxX, maxY, target };
      })
    );
  };

  const getAt = (x: number, y: number): ImageAnnotationTarget | null => {
    const idxHits = tree.search({
      minX: x,
      minY: y,
      maxX: x,
      maxY: y
    }).map(item => item.target);

    // Exact hit test on shape (not needed for rectangles!)
    const exactHits = idxHits.filter(target => {
      return (target.selector.type === ShapeType.RECTANGLE) ||
        intersects(target.selector, x, y);
    });

    // Get smallest shape
    if (exactHits.length > 0) {
      exactHits.sort((a, b) => computeArea(a.selector) - computeArea(b.selector));
      return exactHits[0];
    }
  };

  const size = () => tree.all().length;

  return {
    all,
    clear,
    getAt,
    insert,
    remove,
    set,
    size,
    update
  }

}

export type ImageAnnotationStore = ReturnType<typeof createImageStore>;

export const createImageStore = (opts: AnnotoriousOptions) => {

  const store = createStore<ImageAnnotation>();

  const tree = createSpatialTree();

  const selection = createSelectionState(store);

  const hover = createHoverState(store);

  const highlight = createHighlightState(store);

  const lifecycle = createLifecyleObserver(selection, store);

  store.observe(({ changes }) => {
    tree.set(changes.created.map(a => a.target as ImageAnnotationTarget), false);
    
    changes.deleted.forEach(a => tree.remove(a.target as ImageAnnotationTarget));
    
    changes.updated.forEach(({ oldValue, newValue }) =>
      tree.update(oldValue.target, newValue.target));
  });

  const getAt = (x: number, y: number): ImageAnnotation | undefined => {
    const target = tree.getAt(x, y);
    return target ? store.getAnnotation(target.annotation) : undefined; 
  }

  return {
    ...store,
    getAt,
    highlight,
    hover,
    lifecycle,
    selection
  }

}