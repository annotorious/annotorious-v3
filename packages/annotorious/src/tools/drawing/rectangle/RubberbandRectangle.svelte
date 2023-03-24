<script type="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { ShapeType, type Rectangle } from '../../../model';
  import type { Transform } from '../../Transform';

  const dispatch = createEventDispatcher<{ create: Rectangle }>();
  
  export let transform: Transform;
  
  let container: SVGGElement;

  let origin: [x: number, y: number]; 

  let anchor: [number, number];

  const onPointerDown = (evt: PointerEvent) => {
    origin = transform.elementToImage(evt.offsetX, evt.offsetY);
    anchor = origin;
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (origin)
      anchor = transform.elementToImage(evt.offsetX, evt.offsetY);
  }
    
  const onPointerUp = () => {
    const [minX, minY] = origin;
    const [maxX, maxY] = anchor;

    const w = maxX - minX;
    const h = maxY - minY;

    const shape: Rectangle = {
      type: ShapeType.RECTANGLE, 
      geometry: {
        bounds: {
          minX, 
          minY,
          maxX,
          maxY
        },
        x: minX, y: minY, w, h
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
      x={origin[0]} 
      y={origin[1]} 
      width={anchor[0] - origin[0]} 
      height={anchor[1] - origin[1]} />
  {/if}
</g>

<style>
  rect {
    fill: rgba(0,0,0,0.5);
    stroke: red;
    stroke-width: 3px;
  }
</style>