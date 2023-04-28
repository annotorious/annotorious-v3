import { Annotation, AnnotationLayer, diffAnnotations, Origin } from '@annotorious/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from 'src/SupabasePluginEvents';
import { parseAnnotationRecord } from './pgCrosswalk';
import type { AnnotationRecord } from '../Types';
import { pgOps } from './pgOps';

export const createSender = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, emitter: Emitter<SupabasePluginEvents>) => {
  const ops = pgOps(anno, supabase);

  const onCreateAnnotation = (a: Annotation) => ops.createAnnotation(a)
    .then(({ error }) => {
      if (error) {
        emitter.emit('saveError', error);
      } else {
        ops.createTarget(a.target).then(({ error }) => {
          if (error) {
            emitter.emit('saveError', error);
          }
        });
      }
    });

  const onDeleteAnnotation = (a: Annotation) => ops.deleteAnnotation(a)
    .then(({ error, status }) => {
      if (status !== 204)
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
      ops.upsertBodies([...addedBodies, ...changedBodies ]);

    if (removedBodies.length > 0)
      ops.deleteBodies(removedBodies);

    if (changedTarget) {
      ops.updateTarget(a.target).then(({ error }) => {
        if (error)
          emitter.emit('saveError', error);
      });
    }
  }

  anno.on('createAnnotation', onCreateAnnotation);
  anno.on('deleteAnnotation', onDeleteAnnotation);
  anno.on('updateAnnotation', onUpdateAnnotation);

  ops.initialLoad().then(({ data, error }) => {
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