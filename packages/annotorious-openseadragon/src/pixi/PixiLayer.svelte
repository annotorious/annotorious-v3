<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import OpenSeadragon from 'openseadragon';
  import type { ImageAnnotationStore } from '@annotorious/annotorious';
  import type { PixiLayerClickEvent } from './PixiLayerClickEvent';
  import { createStage } from './stageRenderer';

  import './PixiLayer.css';

  export let store: ImageAnnotationStore;

  export let viewer: OpenSeadragon.Viewer;

  const { hover } = store;
  
  const dispatch = createEventDispatcher<{ click: PixiLayerClickEvent}>();

  let stage: ReturnType<typeof createStage>;

  let dragged = false;

  // Helper
  const getImageXY = (xy: OpenSeadragon.Point): OpenSeadragon.Point => {
    const offsetXY = new OpenSeadragon.Point(xy.x, xy.y);
    const {x, y} = viewer.viewport.pointFromPixel(offsetXY);
    return viewer.viewport.viewportToImageCoordinates(x, y);
  }

  const onPointerMove = (canvas: HTMLCanvasElement) => (evt: PointerEvent) => {
    const {x, y} = getImageXY(new OpenSeadragon.Point(evt.offsetX, evt.offsetY));
    const hovered = store.getAt(x, y);

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

    if (!dragged) {
      const {x, y} = getImageXY(evt.position);
      const annotation = store.getAt(x, y);

      if (annotation)
        dispatch('click', { originalEvent, annotation });
      else
        dispatch('click', { originalEvent });
    }

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
    const { created, updated, deleted } = event.changes;

    created.forEach(annotation => stage.addAnnotation(annotation));

    updated.forEach(({ oldValue, newValue }) => stage.updateAnnotation(oldValue, newValue));

    deleted.forEach(annotation => stage.removeAnnotation(annotation));
    
    stage.redraw();
  });
</script>
