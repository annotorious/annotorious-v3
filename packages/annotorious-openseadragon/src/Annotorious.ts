import type OpenSeadragon from 'openseadragon';
import type { SvelteComponent } from 'svelte';
import { createAnonymousGuest, Origin } from '@annotorious/core';
import type { Annotator, PresenceProvider, User } from '@annotorious/core';
import { createImageStore, fillDefaults, listTools, getTool } from '@annotorious/annotorious';
import type { AnnotoriousOptions, ImageAnnotation } from '@annotorious/annotorious';
import { parseW3C, type WebAnnotation } from '@annotorious/formats';
import { PixiLayer, type PixiLayerClickEvent } from './pixi';
import { SVGDrawingLayer, SVGPresenceLayer } from './svg';
import { initKeyCommands } from './keyCommands';
import { fitBounds as _fitBounds, fitBoundsWithConstraints as _fitBoundsWithConstraints } from './api';

export type OSDAnnotator = Annotator<ImageAnnotation> & ReturnType<typeof Annotorious>;

export const Annotorious = (viewer: OpenSeadragon.Viewer, options: AnnotoriousOptions = {}) => {

  const opts = fillDefaults(options);

  const store = createImageStore(opts);

  if (opts.keyboardCommands)
    initKeyCommands(viewer.element, store);

  let currentUser: User = opts.readOnly ? null : createAnonymousGuest();

  const displayLayer = new PixiLayer({
    target: viewer.element,
    props: { store, viewer }
  });

  const presenceLayer = new SVGPresenceLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { store, viewer, provider: null }
  });

  const drawingLayer = new SVGDrawingLayer({
    target: viewer.element.querySelector('.openseadragon-canvas'),
    props: { store, viewer, user: currentUser }
  });

  displayLayer.$on('click', (evt: CustomEvent<PixiLayerClickEvent>) => {
    const { originalEvent, annotation } = evt.detail;
    if (annotation)
      store.selection.clickSelect(annotation.id, originalEvent);
    else if (!store.selection.isEmpty())
      store.selection.clear();
  });

  /*************************/
  /*      External API     */
  /******++++++*************/

  const fitBounds = _fitBounds(viewer, store);

  const fitBoundsWithConstraints = _fitBoundsWithConstraints(viewer, store);

  const getUser = () => currentUser;

  const loadAnnotations = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((annotations: WebAnnotation[]) => {
        setAnnotations(annotations);
        return annotations;
      });

  const setAnnotations = (annotations: WebAnnotation[]) => {
    const { parsed, failed } = parseW3C(annotations);

    if (failed.length > 0)
      console.warn(`Discarded ${failed.length} invalid annotations`, failed);

    store.bulkAddAnnotation(parsed, true, Origin.REMOTE);
  }

  const setPresenceProvider = (provider: PresenceProvider) =>
    presenceLayer.$set({ provider });

  const setUser = (user: User) => {
    currentUser = user;
    drawingLayer.$set({ user });
  }

  const startDrawing = (tool: string, keepEnabled: boolean = false) => {
    const t = getTool(tool) as typeof SvelteComponent;
    //@ts-ignore
    drawingLayer.$set({ tool: t, keepEnabled })
  }

  const stopDrawing = () => {
    //@ts-ignore
    drawingLayer.$set({ tool: null });
  }

  return {
    fitBounds,
    fitBoundsWithConstraints,
    getUser,
    listTools,
    loadAnnotations,
    on: store.lifecycle.on,
    off: store.lifecycle.off,
    setAnnotations,
    setPresenceProvider,
    setUser,
    startDrawing,
    stopDrawing,
    selection: store.selection,
    store
  }

}
