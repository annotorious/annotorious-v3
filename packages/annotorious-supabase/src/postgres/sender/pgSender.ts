import { Annotation, Annotator, diffAnnotations, Origin } from '@annotorious/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from 'src/SupabasePluginEvents';
import { parseAnnotationRecord } from './pgCrosswalk';
import type { AnnotationRecord } from '../Types';
import { pgOps } from './pgOps';

export const createSender = (anno: Annotator, layerId: string, supabase: SupabaseClient, emitter: Emitter<SupabasePluginEvents>) => {
  const ops = pgOps(anno, supabase);

  const onCreateAnnotation = (a: Annotation) => ops.createAnnotation(a, layerId)
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
      addedBodies, 
      removedBodies, 
      changedBodies, 
      changedTarget 
    } = diffAnnotations(previous, a);

    if ((addedBodies.length + changedBodies.length) > 0)
      ops.upsertBodies([...addedBodies, ...changedBodies ], layerId).then(({ error }) => {
        if (error)
          emitter.emit('saveError', error);
      });

    if (removedBodies.length > 0)
      ops.deleteBodies(removedBodies).then(response => {
        console.log('[PG] DELETE bodies response', response);
      });

    if (changedTarget) {
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
    }

  }

}