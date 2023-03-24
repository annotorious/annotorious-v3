<script type="ts">
  import { onMount, type SvelteComponent } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import OpenSeadragon from 'openseadragon';
  import type { User } from '@annotorious/core';
  import { getEditor } from '@annotorious/annotorious';
  import type { AnnotoriousOptions, ImageAnnotation, Shape, ImageAnnotationStore } from '@annotorious/annotorious';
    
  export let store: ImageAnnotationStore;

  export let viewer: OpenSeadragon.Viewer;

  export let opts: AnnotoriousOptions;

  export let user: User;

  export let tool: typeof SvelteComponent = null;

  export let keepEnabled: boolean = false;

  const { selection } = store;

  // CSS transform, SVG overlay to OSD viewport state
  let overlayTransform: string;

  let scale = 1;

  $: if (tool && $selection) { selection.clear() }
  
  $: tool ? viewer.setMouseNavEnabled(false) : viewer.setMouseNavEnabled(true); 

  // Coordinate transform, element offset to OSD image coordinates
  const toolTransform = (offsetX: number, offsetY: number): [number, number] => {
    const {x, y} = viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(offsetX, offsetY));
    return [x, y];
  }

  const onUpdateViewport = () => {
    const containerWidth = viewer.viewport.getContainerSize().x;

    const zoom = viewer.viewport.getZoom(true);
    const flipped = viewer.viewport.getFlip();

    const p = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(0, 0), true);
    if (flipped)
      p.x = containerWidth - p.x;
    
    const scaleY = zoom * containerWidth / viewer.world.getContentFactor();
    const scaleX = flipped ? - scaleY : scaleY;
    const rotation = viewer.viewport.getRotation();

    overlayTransform = `translate(${p.x}, ${p.y}) scale(${scaleX}, ${scaleY}) rotate(${rotation})`;

    scale = zoom * containerWidth / viewer.world.getContentFactor();
  }

  const onGrab = () => viewer.setMouseNavEnabled(false);
  
  const onRelease = () => viewer.setMouseNavEnabled(true);

  const onChangeSelected = (annotation: ImageAnnotation) => (event: CustomEvent<Shape>) => {  
    const { target } = annotation;

    // We don't consider a shape edit an 'update' if it happens within 10mins
    const GRACE_PERIOD = 10 * 60 * 1000;

    const isUpdate = 
      target.creator?.id !== user.id ||
      !target.created ||
      new Date().getTime() - target.created.getTime() > GRACE_PERIOD;

    store.updateTarget({
      ...target,
      selector: event.detail,
      created: isUpdate ? target.created : new Date(),
      updated: isUpdate ? new Date() : null,
      updatedBy: isUpdate ? user : null
    });
  }

  const onSelectionCreated = <T extends Shape>(evt: CustomEvent<T>) => {
    const { detail } = evt;

    if (!keepEnabled) {
      tool = null;
      viewer.setMouseNavEnabled(true);

      const id = uuidv4();

      const annotation: ImageAnnotation = {
        id,
        bodies: [],
        target: {
          annotation: id,
          selector: detail,
          creator: user,
          created: new Date()
        }
      }

      store.addAnnotation(annotation);

      selection.setSelected(annotation.id);
    }
  }

  onMount(() => {
    viewer.addHandler('update-viewport', onUpdateViewport);

    return () => {
      viewer.removeHandler('update-viewport', onUpdateViewport);
    }
  }); 

  // A typecasting helper, because 'as' doesn't work in Svelte markup
  const cast = <T extends Shape>(x: Shape) => x as T
</script>

<svg 
  class="a9s-svg-drawing-canvas"
  class:drawing={tool}>
  <g transform={overlayTransform}>
    {#if $selection}
      {#each $selection as selected}
        <svelte:component 
          this={getEditor(selected.target.selector)}
          shape={cast(selected.target.selector)}
          transform={{ elementToImage: toolTransform }}
          viewportScale={scale}
          on:grab={onGrab} 
          on:change={onChangeSelected(selected)}
          on:release={onRelease} />
      {/each}
    {:else if Boolean(tool)} 
      <svelte:component 
        this={tool}
        transform={{ elementToImage: toolTransform }}
        viewportScale={scale}
        on:create={onSelectionCreated} />
    {/if}
  </g>
</svg>

<style>
  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    outline: none;
    pointer-events: none;
  }
  
  svg.drawing {
    pointer-events: all;
  }

  svg * {
    pointer-events: all;
  }
</style>