<script type="ts">
  import { boundsFromPoints, type Polygon } from '../../../model';
  import type { Transform } from '../../Transform';
  import { Editor, Handle } from '..';

  export let shape: Polygon;

  export let transform: Transform;

  export let viewportScale: number = 1;

  $: geom = shape.geometry;

  $: handleSize = 10 / viewportScale;

  const editor = (polygon: Polygon, handle: Handle, delta: [number, number]) => {
    let points: [number, number][];

    if (handle === Handle.SHAPE) {
      points = polygon.geometry.points.map(([x, y]) => [x + delta[0], y + delta[1]]);
    } else {
      points = polygon.geometry.points.map(([x, y], idx) =>
        handle === Handle(idx) ? [x + delta[0], y + delta[1]] : [x, y]
      );
    }

    const bounds = boundsFromPoints(points);

    return {
      ...polygon,
      geometry: { points, bounds }
    }
  }
</script>

<Editor
  shape={shape}
  transform={transform}
  editor={editor}
  on:change 
  on:grab
  on:release
  let:grab={grab}>

  <polygon
    class="a9s-shape-handle"
    on:pointerdown={grab(Handle.SHAPE)}
    points={geom.points.map(xy => xy.join(',')).join(' ')} />

  {#each geom.points as point, idx}
    <rect 
      class="a9s-corner-handle"
      on:pointerdown={grab(Handle(idx))}
      x={point[0] - handleSize / 2} y={point[1] - handleSize / 2} height={handleSize} width={handleSize} />
  {/each}
</Editor>

<style>
  :global(.a9s-annotation.selected .a9s-corner-handle) {
    cursor: move;
  }
</style>