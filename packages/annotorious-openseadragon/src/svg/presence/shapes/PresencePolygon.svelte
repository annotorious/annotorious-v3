<script type="ts">
  import type { PresentUser } from '@annotorious/core';
  import type { ImageAnnotation, PolygonGeometry } from '@annotorious/annotorious';

  export let annotation: ImageAnnotation;

  export let user: PresentUser;

  export let scale: number;

  $: geom = annotation.target.selector.geometry as PolygonGeometry;
</script>

<g class="a9s-presence-overlay">
  <polygon
    class="a9s-presence-shape a9s-presence-polygon"
    stroke={user.color}
    fill="transparent"
    points={geom.points.map(xy => xy.join(',')).join(' ')} />
</g>

<style>
  polygon {
    stroke-width: 1.2;
    vector-effect: non-scaling-stroke;
  }
</style>