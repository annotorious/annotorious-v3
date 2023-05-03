<script type="ts">
  import { onMount } from 'svelte';
  import type OpenSeadragon from 'openseadragon';
  import { draggable } from '@neodrag/svelte';
  import type { ImageAnnotationStore } from '@annotorious/annotorious';
  import { defaultStrategy } from './PlacementStrategy';

  export let store: ImageAnnotationStore;

  export let viewer: OpenSeadragon.Viewer;

  const { selection } = store; 

  let lastPointerDown: PointerEvent;

  let left: number;

  let top: number;

  const dragOpts = {
    ignoreMultitouch: true,

    onDragStart: () => {
      viewer.setMouseNavEnabled(false);
    },

    onDragEnd: () => {
      viewer.setMouseNavEnabled(true);
    }
  }

  $: if ($selection) setPosition($selection);

  const setPosition = (selection: string[]) => {
    // Note: this demo popup only supports a single selection
    const annotation = store.getAnnotation(selection[0]);
    [left, top] = defaultStrategy(annotation, lastPointerDown);
  }

  onMount(() => {
    const onPointerDown = (event: PointerEvent) => 
      lastPointerDown = event;

    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    }
  });
</script>

{#if $selection}
  <div use:draggable={dragOpts} class="popup" style={`left: ${left}px; top: ${top}px`}>
    {$selection.join(', ')}
  </div>
{/if}

<style>
  .popup {
    background-color: #fff;
    border: 1px solid #a2a2a2;
    height: 250px;
    position: absolute;
    width: 400px;
    z-index: 1;
  }
</style>