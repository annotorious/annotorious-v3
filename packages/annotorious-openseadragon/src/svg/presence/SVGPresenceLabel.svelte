<script type="ts">
  import type { PresentUser } from '@annotorious/core';

  export let x: number;

  export let y: number;

  export let user: PresentUser;

  export let scale: number;

  let g: SVGGElement;

  $: if (g) setWidth(scale);

  const setWidth = (scale: number) => {
    const textEl = g.querySelector('text');
    const rectEl = Array.from(g.querySelectorAll('rect'));

    const width = textEl.getBBox().width + 10 / scale;
    rectEl.forEach(r => r.setAttribute('width', `${width}`));
  }
</script>

<g class="a9s-presence-label" bind:this={g}>
  <rect
    class="a9s-presence-label-bg-bottom" 
    x={x + Math.round(2 / scale)} 
    y={y - 10 / scale} 
    height={10 / scale} 
    fill={user.color}/>

  <rect
    class="a9s-presence-label-bg-top" 
    x={x + Math.round(2 / scale)} 
    rx={5 / scale}
    y={y - 20 / scale} 
    ry={5 / scale}
    height={14 / scale} 
    fill={user.color}/>

  <text font-size={12 / scale} x={x + Math.round(6 / scale)} y={y - 7 / scale}>{user.user.email}</text>
</g>

<style>
  text {
    fill: #fff;
    font-family: Arial, Helvetica, sans-serif;
  }
</style>