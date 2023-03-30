<script type="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { ShapeType, type Rectangle } from '../../../model';
  import type { Transform } from '../../Transform';

  const dispatch = createEventDispatcher<{ create: Rectangle }>();
  
  export let transform: Transform;
  
  let container: SVGGElement;

  let origin: [x: number, y: number]; 

  let anchor: [number, number];

  let x: number, y: number, w: number, h: number;

  const onPointerDown = (evt: PointerEvent) => {
    origin = transform.elementToImage(evt.offsetX, evt.offsetY);
    anchor = origin;

    x = origin[0];
    y = origin[1];
    w = 1;
    h = 1;
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (origin) {
      anchor = transform.elementToImage(evt.offsetX, evt.offsetY);

      x = Math.min(anchor[0], origin[0]);
      y = Math.min(anchor[1], origin[1]);
      w = Math.abs(anchor[0] - origin[0]);
      h = Math.abs(anchor[1] - origin[1]);
    }
  }
    
  const onPointerUp = () => {
    const shape: Rectangle = {
      type: ShapeType.RECTANGLE, 
      geometry: {
        bounds: {
          minX: x, 
          minY: y,
          maxX: x + w,
          maxY: y + h
        },
        x, y, w, h
      }
    }

    origin = null;
    anchor = null;
    
    dispatch('create', shape);
  }

  onMount(() => {
    const svg = container.closest('svg');

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);

    return () => {
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerup', onPointerUp); 
    }
  });
</script>

<g bind:this={container}>
  {#if origin}
    <rect
      x={x} 
      y={y} 
      width={w} 
      height={h} />
  {/if}
</g>

<style>
  rect {
    fill: rgba(0,0,0,0.5);
    stroke: red;
    stroke-width: 3px;
  }
</style>