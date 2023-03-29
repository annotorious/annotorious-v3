import type OpenSeadragon from 'openseadragon';
import { createImageStore, fillDefaults, listTools, getTool, type ImageAnnotation } from '@annotorious/annotorious';
import type { AnnotoriousOptions } from '@annotorious/annotorious';
import { createAnonymousGuest, createLifecyleObserver, Origin, type AnnotationLayer, type User } from '@annotorious/core';
import { parseW3C, type WebAnnotation } from '@annotorious/formats';
import { PixiLayer, type PixiLayerClickEvent } from './pixi';
import { SVGDrawingLayer } from './svg';

export type OSDAnnotationLayer = AnnotationLayer<ImageAnnotation> & ReturnType<typeof Annotorious>;

export const Annotorious = (viewer: OpenSeadragon.Viewer, options: AnnotoriousOptions = {}) => {

  const opts = fillDefaults(options);

  const store = createImageStore(opts);

  const lifecycle = createLifecyleObserver(store.selection, store);

  let currentUser = opts.readOnly ? null : createAnonymousGuest();

  const displayLayer = new PixiLayer({
    target: viewer.element,
    props: { store, viewer }
  });

  const drawingLayer = new SVGDrawingLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { store, viewer, user: currentUser }
  });

  displayLayer.$on('click', (evt: CustomEvent<PixiLayerClickEvent>) => {
    const { originalEvent, annotation } = evt.detail;
    if (annotation)
      store.selection.clickSelect(originalEvent, annotation.id);
    else if (!store.selection.isEmpty())
      store.selection.clear();
  });

  const setAnnotations = (annotations: WebAnnotation[]) => {
    const { parsed, failed } = parseW3C(annotations);

    if (failed.length > 0)
      console.warn(`Discarded ${failed.length} invalid annotations`, failed);

    store.bulkAddAnnotation(parsed, true, Origin.REMOTE);
  }

  const setUser = (user: User) => {
    currentUser = user;
    drawingLayer.$set({ user });
  }

  const getUser = () => currentUser;

  const startDrawing = (tool: string, keepEnabled: boolean = false) => {
    const t = getTool(tool);
    drawingLayer.$set({ tool: t, keepEnabled })
  }

  return {
    getUser,
    listTools,
    on: lifecycle.on,
    off: lifecycle.off,
    setAnnotations,
    setUser,
    startDrawing,
    store
  }

}