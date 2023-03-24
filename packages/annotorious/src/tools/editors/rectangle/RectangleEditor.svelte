<script type="ts">
  import { Editor, Handle } from '..';
  import type { Rectangle } from '../../../model';
  import type { Transform } from '../../Transform';

  export let shape: Rectangle;

  export let transform: Transform;

  export let viewportScale: number = 1;

  $: geom = shape.geometry;

  $: handleSize = 10 / viewportScale;

  const editor = (rectangle: Rectangle, handle: Handle, delta: [number, number]) => {
    const initialBounds = rectangle.geometry.bounds;

    let [x0, y0] = [initialBounds.minX, initialBounds.minY];
    let [x1, y1] = [initialBounds.maxX, initialBounds.maxY];

    const [dx, dy] = delta;

    if (handle === Handle.SHAPE) {
      x0 += dx;
      x1 += dx;
      y0 += dy;
      y1 += dy;
    } else {
      switch (handle) {
        case Handle.TOP:
        case Handle.TOP_LEFT:
        case Handle.TOP_RIGHT: {
          y0 += dy;
          break;
        }

        case Handle.BOTTOM:
        case Handle.BOTTOM_LEFT:
        case Handle.BOTTOM_RIGHT: {
          y1 += dy;
          break;
        }
      }

      switch (handle) {
        case Handle.LEFT:
        case Handle.TOP_LEFT:
        case Handle.BOTTOM_LEFT: {
          x0 += dx;
          break;
        }

        case Handle.RIGHT:
        case Handle.TOP_RIGHT:
        case Handle.BOTTOM_RIGHT: {
          x1 += dx;
          break;
        }
      }
    }

    return {
      ...rectangle,
      geometry: {
        x: x0,
        y: y0,
        w: x1 - x0,
        h: y1 - y0,
        bounds: {
          minX: x0,
          minY: y0,
          maxX: x1,
          maxY: y1
        }
      }
    };
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

  <rect 
    class="a9s-shape-handle"
    on:pointerdown={grab(Handle.SHAPE)}
    x={geom.x} y={geom.y} width={geom.w} height={geom.h} />

  <rect 
    class="a9s-edge-handle a9s-edge-handle-top" 
    on:pointerdown={grab(Handle.TOP)}
    x={geom.x} y={geom.y} height={1} width={geom.w} />

  <rect 
    class="a9s-edge-handle a9s-edge-handle-right"
    on:pointerdown={grab(Handle.RIGHT)}
    x={geom.x + geom.w} y={geom.y} height={geom.h} width={1}/>

  <rect 
    class="a9s-edge-handle a9s-edge-handle-bottom" 
    on:pointerdown={grab(Handle.BOTTOM)}
    x={geom.x} y={geom.y + geom.h} height={1} width={geom.w} />

  <rect 
    class="a9s-edge-handle a9s-edge-handle-left" 
    on:pointerdown={grab(Handle.LEFT)}
    x={geom.x} y={geom.y} height={geom.h} width={1} />

  <rect 
    class="a9s-corner-handle a9s-corner-handle-topleft"
    on:pointerdown={grab(Handle.TOP_LEFT)}
    x={geom.x - handleSize / 2} y={geom.y - handleSize / 2} height={handleSize} width={handleSize} />

  <rect 
    class="a9s-corner-handle a9s-corner-handle-topright"
    on:pointerdown={grab(Handle.TOP_RIGHT)}
    x={geom.x + geom.w - handleSize / 2} y={geom.y - handleSize / 2} height={handleSize} width={handleSize} />
  
  <rect 
    class="a9s-corner-handle a9s-corner-handle-bottomright"
    on:pointerdown={grab(Handle.BOTTOM_RIGHT)}
    x={geom.x + geom.w - handleSize / 2} y={geom.y + geom.h - handleSize / 2} height={handleSize} width={handleSize} />
    
  <rect 
    class="a9s-corner-handle a9s-corner-handle-bottomleft"
    on:pointerdown={grab(Handle.BOTTOM_LEFT)}
    x={geom.x - handleSize / 2} y={geom.y + geom.h - handleSize / 2} height={handleSize} width={handleSize} />
</Editor>