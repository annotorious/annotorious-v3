import { Annotation, Annotator, diffAnnotations, Origin } from '@annotorious/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from 'src/SupabasePluginEvents';
import { parseAnnotationRecord } from './pgCrosswalk';
import type { AnnotationRecord } from '../Types';
import { pgOps } from './pgOps';

export const createSender = (anno: Annotator, layerId: string, supabase: SupabaseClient, emitter: Emitter<SupabasePluginEvents>) => {

  let privacyMode = false;

  const ops = pgOps(anno, supabase);

  const onCreateAnnotation = (a: Annotation) => ops.createAnnotation(a, layerId, privacyMode)
    .then(({ error }) => {
      if (error) {
        emitter.emit('saveError', error);
      } else {
        ops.createTarget(a.target, layerId).then(response => {
          console.log('[PG] INSERT response', response);

          if (response.error) {
            emitter.emit('saveError', response.error);
          }
        });
      }
    });

  const onDeleteAnnotation = (a: Annotation) => ops.deleteAnnotation(a)
    .then(({ error }) => {
      if (error)
        emitter.emit('saveError', error);
    });

  const onUpdateAnnotation = (a: Annotation, previous: Annotation) => {
    const { 
      oldValue,
      newValue,
      bodiesCreated, 
      bodiesDeleted, 
      bodiesUpdated, 
      targetUpdated 
    } = diffAnnotations(previous, a);

    // Check if annotation visibility has changed
    const oldVisibility = oldValue.visibility;
    const newVisibility = newValue.visibility;

    if (oldVisibility !== newVisibility)
      ops.updateVisibility(newValue).then(({ error }) => {
        if (error)
          emitter.emit('saveError', error);
      });

    if ((bodiesCreated.length + bodiesUpdated.length) > 0)
      ops.upsertBodies([
        ...bodiesCreated, 
        ...bodiesUpdated.map(u => u.newBody) 
      ], layerId).then(({ error }) => {
        if (error)
          emitter.emit('saveError', error);
      });

    if (bodiesDeleted.length > 0)
      ops.deleteBodies(bodiesDeleted).then(response => {
        console.log('[PG] DELETE bodies response', response);
      });

    if (targetUpdated) {
      ops.updateTarget(a.target).then(response => {
        console.log('[PG] UPDATE target response', response);

        if (response.error)
          emitter.emit('saveError', response.error);
      });
    }
  }

  anno.on('createAnnotation', onCreateAnnotation);
  anno.on('deleteAnnotation', onDeleteAnnotation);
  anno.on('updateAnnotation', onUpdateAnnotation);

  ops.initialLoad(layerId).then(({ data, error }) => {
    if (error) {
      emitter.emit('initialLoadError', error);
    } else {
      const annotations = (data as AnnotationRecord[]).map(parseAnnotationRecord);
      
      anno.store.bulkAddAnnotation(annotations, true, Origin.REMOTE);

      emitter.emit('initialLoad', annotations);
    }
  });

  return {
    destroy: () => {
      anno.off('createAnnotation', onCreateAnnotation);
      anno.off('deleteAnnotation', onDeleteAnnotation);
      anno.off('updateAnnotation', onUpdateAnnotation);
    },
    get privacyMode() {
      return privacyMode;
    },
    set privacyMode(mode: boolean) {
      privacyMode = mode;
    }
  }

}