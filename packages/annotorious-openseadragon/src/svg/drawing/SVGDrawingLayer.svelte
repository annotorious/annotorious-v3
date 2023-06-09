<script type="ts">
  import type { SvelteComponent } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import OpenSeadragon from 'openseadragon';
  import type { StoreChangeEvent, User } from '@annotorious/core';
  import { getEditor } from '@annotorious/annotorious';
  import type { ImageAnnotation, Shape, ImageAnnotationStore } from '@annotorious/annotorious';
  import OSDLayer from '../OSDLayer.svelte';
    
  export let store: ImageAnnotationStore;

  export let viewer: OpenSeadragon.Viewer;

  export let user: User;

  export let tool: typeof SvelteComponent = null;

  export let keepEnabled: boolean = false;

  // Selected IDs
  const { selection } = store;

  // Selected annotations, tracked live from the store
  let selectedAnnotations: ImageAnnotation[] = null;

  let storeObserver = null;

  // Disable mouse nav when new tool activates
  $: tool ? viewer.setMouseNavEnabled(false) : viewer.setMouseNavEnabled(true); 

  // Clear selection when new tool activates
  $: tool && selection.clear();

  // If there's no selection and keepEnabled is on, disable mouse nav
  $: if ($selection.selected.length === 0 && keepEnabled && tool) { viewer.setMouseNavEnabled(false) }
  
  $: trackSelection($selection.selected);

  const trackSelection = (ids: string[]) => {
    store.unobserve(storeObserver);

    if (ids.length > 0) {
      // Resolve selected IDs from the store
      selectedAnnotations = ids.map(id => store.getAnnotation(id));

      // Track updates on the selected annotations
      storeObserver = (event: StoreChangeEvent<ImageAnnotation>) => {
        const { updated } = event.changes;
        selectedAnnotations = updated.map(change => change.newValue);
      }   
      
      store.observe(storeObserver, { annotations: ids });
    } else {
      selectedAnnotations = null;
    }
  }

  // Coordinate transform, element offset to OSD image coordinates
  const toolTransform = (offsetX: number, offsetY: number): [number, number] => {
    const {x, y} = viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(offsetX, offsetY));
    return [x, y];
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
    const id = uuidv4();

    const annotation: ImageAnnotation = {
      id,
      bodies: [],
      target: {
        annotation: id,
        selector: evt.detail,
        creator: user,
        created: new Date()
      }
    }

    store.addAnnotation(annotation);

    selection.setSelected(annotation.id);

    viewer.setMouseNavEnabled(true);

    if (!keepEnabled)
      tool = null;
  }

  // A typecasting helper, because 'as' doesn't work in Svelte markup
  const cast = <T extends Shape>(x: Shape) => x as T
</script>

<OSDLayer viewer={viewer} let:transform let:scale>
  <svg 
    class="a9s-svg-drawing-canvas"
    class:drawing={tool}>

    <g transform={transform}>
      {#if selectedAnnotations}
        {#each selectedAnnotations as selected}
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
</OSDLayer>

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