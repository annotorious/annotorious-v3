

<script type="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { boundsFromPoints, ShapeType, type Polygon } from '../../../model';
  import { distance } from '../../../geom';
  import type { Transform } from '../../Transform';

  const dispatch = createEventDispatcher<{ create: Polygon }>();

  export let transform: Transform;

  export let viewportScale: number = 1;

  let container: SVGGElement;

  let points: [number, number][] = [];
  
  let cursor: [number, number] = null;

  let isClosable: boolean = false;

  const CLOSE_DISTANCE = 40;

  $: handleSize = 10 / viewportScale;

  const onPointerDown = (evt: PointerEvent) => {
    const point = transform.elementToImage(evt.offsetX, evt.offsetY);

    if (points.length === 0)
      points.push(point);

    cursor = point;
  }

  const onPointerMove = (evt: PointerEvent) => {
    if (points.length > 0) {
      cursor = transform.elementToImage(evt.offsetX, evt.offsetY);

      if (points.length >  2) {
        const d = distance(cursor, points[0]) * viewportScale;
        isClosable = d < CLOSE_DISTANCE;
      }
    }
  }

  const onPointerUp = () => {
    if (isClosable) {
      const shape: Polygon = {
        type: ShapeType.POLYGON, 
        geometry: {
          bounds: boundsFromPoints(points),
          points: [...points]
        }
      }

      points = [];
      cursor = null;
    
      dispatch('create', shape);
    } else {
      points.push(cursor);
    }
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
  {#if cursor}
    <g class="a9s-selection polygon">
      <polygon points={(isClosable ? points : [...points, cursor]).map(xy => xy.join(',')).join(' ')} />
        
      {#if isClosable}
        <rect 
          class="a9s-corner-handle"
          x={points[0][0] - handleSize / 2} y={points[0][1] - handleSize / 2} height={handleSize} width={handleSize} />
      {/if}
    </g>
  {/if}
</g>

<style>
  polygon {
    vector-effect: non-scaling-stroke;
    fill: rgba(26, 115, 232, 0.25);
    stroke: rgb(26, 115, 232);
    stroke-width: 2px;
  }

  .a9s-corner-handle {
    vector-effect: non-scaling-stroke;
    fill: rgba(255, 255, 255);
    stroke: rgb(26, 115, 232);
    stroke-width: 1px;
  }
</style>