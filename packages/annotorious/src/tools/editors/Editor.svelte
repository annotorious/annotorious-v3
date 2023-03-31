<script type="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Shape } from '../../model';
  import type { Handle } from './Handle';
  import type { Transform } from '../Transform';

  const dispatch = createEventDispatcher<{ grab: undefined, release: undefined, change: Shape }>();

  export let shape: Shape;

  export let editor: (shape: Shape, handle: Handle, delta: [number, number]) => Shape;

  export let transform: Transform;

  let grabbedHandle: Handle = null;

  let origin: [number, number];

  let initialShape: Shape = null;

  const onGrab = (handle: Handle) => (evt: PointerEvent) => {
    grabbedHandle = handle;
    origin = transform.elementToImage(evt.offsetX, evt.offsetY);
    initialShape = shape;

    const target = evt.target as Element;
    target.setPointerCapture(evt.pointerId);

    dispatch('grab');
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (grabbedHandle) {
      const [x, y] = transform.elementToImage(evt.offsetX, evt.offsetY);

      const delta: [number, number] = [x - origin[0], y - origin[1]];

      shape = editor(initialShape, grabbedHandle, delta)
      
      dispatch('change', shape);
    }
  }

  const onRelease = (evt: PointerEvent) => {
    const target = evt.target as Element;
    target.releasePointerCapture(evt.pointerId);

    grabbedHandle = null;

    initialShape = shape;
    
    dispatch('release');
  }
</script>

<g
  class="a9s-annotation selected"
  on:pointerup={onRelease}
  on:pointermove={onPointerMove}>

  <slot grab={onGrab} />
</g>

<style>
  :global(.a9s-annotation.selected *) {
    vector-effect: non-scaling-stroke;
  }

  :global(.a9s-annotation.selected .a9s-corner-handle) {
    fill: #fff;
    stroke: #000;
    stroke-width: 1px;
  }

  :global(.a9s-annotation.selected .a9s-shape-handle) {
    fill: transparent;
    stroke: #000;
    stroke-width: 1px;
    cursor: move;
  }

  :global(.a9s-annotation.selected .a9s-edge-handle) {
    fill: transparent;
    stroke: transparent;
    stroke-width: 6px;
  }

  :global(.a9s-annotation.selected .a9s-edge-handle-top) {
    cursor:n-resize;
  }

  :global(.a9s-annotation.selected .a9s-edge-handle-right) {
    cursor:e-resize;
  }

  :global(.a9s-annotation.selected .a9s-edge-handle-bottom) {
    cursor:s-resize;
  }

  :global(.a9s-annotation.selected .a9s-edge-handle-left) {
    cursor:w-resize;
  }

  :global(.a9s-annotation.selected .a9s-corner-handle-topleft) {
    cursor:nw-resize;
  }

  :global(.a9s-annotation.selected .a9s-corner-handle-topright) {
    cursor:ne-resize;
  }

  :global(.a9s-annotation.selected .a9s-corner-handle-bottomright) {
    cursor:se-resize;
  }
  
  :global(.a9s-annotation.selected .a9s-corner-handle-bottomleft) {
    cursor:sw-resize;
  }
</style>