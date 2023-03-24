<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import OpenSeadragon from 'openseadragon';
  import type { AnnotoriousOptions, ImageAnnotationStore } from '@annotorious/annotorious';
  import type { PixiLayerClickEvent } from './PixiLayerClickEvent';
  import { createStage } from './stageRenderer';

  export let store: ImageAnnotationStore;

  export let viewer: OpenSeadragon.Viewer;

  export let opts: AnnotoriousOptions;

  const { hover } = store;
  
  const dispatch = createEventDispatcher<{ click: PixiLayerClickEvent}>();

  let stage: ReturnType<typeof createStage>;

  let dragged = false;

  const onPointerMove = (canvas: HTMLCanvasElement) => (evt: PointerEvent) => {
    const offsetXY = new OpenSeadragon.Point(evt.offsetX, evt.offsetY);
    const {x, y} = viewer.viewport.pointFromPixel(offsetXY);
    const imageXY = viewer.viewport.viewportToImageCoordinates(x, y);

    const hovered = store.getAt(imageXY.x, imageXY.y);

    if (hovered) {
      canvas.classList.add('hover');

      if ($hover !== hovered.id)
        store.hover.set(hovered.id);
    } else {
      canvas.classList.remove('hover');

      if ($hover)
        store.hover.set(null);
    }
  }

  const onCanvasRelease = (evt: OpenSeadragon.CanvasReleaseEvent) => {
    const originalEvent = evt.originalEvent as PointerEvent;

    if (!dragged)
      if ($hover)
        dispatch('click', { originalEvent, annotation: store.getAnnotation($hover) });
      else
        dispatch('click', { originalEvent });

    dragged = false;
  }

  const onCanvasDrag = () => dragged = true;

  onMount(() => {
    const { offsetWidth, offsetHeight } = viewer.canvas;

    // Create Canvas element
    const canvas = document.createElement('canvas');
    canvas.width = offsetWidth;
    canvas.height = offsetHeight;
    canvas.className = 'a9s-gl-canvas';

    viewer.element.querySelector('.openseadragon-canvas').appendChild(canvas);

    // Create Pixi stage
    stage = createStage(viewer, canvas);

    // Event handlers
    const moveHandler = onPointerMove(canvas);
    canvas.addEventListener('pointermove', moveHandler); 

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;

      canvas.width = width;
      canvas.height = height;
      
      stage.resize(width, height);
    });

    observer.observe(canvas);

    viewer.addHandler('canvas-drag', onCanvasDrag);
    viewer.addHandler('canvas-release', onCanvasRelease);
    viewer.addHandler('update-viewport', stage.redraw);

    return () => {
      canvas.removeEventListener('pointermove', moveHandler);

      viewer.removeHandler('canvas-drag', onCanvasDrag);
      viewer.removeHandler('canvas-release', onCanvasRelease);
      viewer.removeHandler('update-viewport', stage.redraw);
    }
  });

  store.observe(event => {
    const { added, updated, deleted } = event.changes;

    added.forEach(annotation => stage.addAnnotation(annotation));

    updated.forEach(({ oldValue, newValue }) => stage.updateAnnotation(oldValue, newValue));

    deleted.forEach(annotation => stage.removeAnnotation(annotation));
    
    stage.redraw();
  });
</script>

<style>
  :global(canvas.a9s-gl-canvas) {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  :global(canvas.a9s-gl-canvas.hover) {
    cursor: pointer !important;
  }
</style>

