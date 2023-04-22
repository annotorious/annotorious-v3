import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Annotation, diffAnnotations, AnnotationLayer, Origin } from '@annotorious/core';
import type { AnnotationRecord, ChangeEvent } from './Types';
import { parseRecord, parseTargetRecord } from './pgCrosswalk';
import { pgOps } from './pgOps';

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient) => {

  const ops = pgOps(anno, supabase);

  const onCreateAnnotation = (a: Annotation) => ops.createAnnotation(a)
    .then(() => ops.createTarget(a.target))
    .then(({ error, status }) => {
      if (status !== 201) {
        console.error(error);
        throw 'Error storing annotation';
      }
    });

  const onDeleteAnnotation = (a: Annotation) => {
    // TODO
    console.log('deleting', a);
  }

  const onUpdateAnnotation = (a: Annotation, previous: Annotation) => {
    const { addedBodies, removedBodies, changedBodies, changedTarget } = diffAnnotations(previous, a);

    // TODO!
    if (changedTarget)
      ops.updateTarget(a.target).then(() => console.log('updated', previous, 'with', a));

    console.log('Body updates:', { addedBodies, removedBodies, changedBodies });
  }

  const connect = (channel: RealtimeChannel) => {
    anno.on('createAnnotation', onCreateAnnotation);
    anno.on('deleteAnnotation', onDeleteAnnotation);
    anno.on('updateAnnotation', onUpdateAnnotation);

    channel.on(
      'postgres_changes', 
      { 
        event: '*', 
        schema: 'public' 
      }, (payload) => {
        const event = payload as unknown as ChangeEvent;
        console.log('[PG Rx]', event.commit_timestamp);

        if (event.table === 'targets') {
          const t = event.new;
          console.log('Updating target after CDC message', t);
          anno.store.updateTarget(parseTargetRecord(event.new));
        }
      });

    ops.initialLoad().then(({ data, error }) => {
      if (!error) {
        const annotations = (data as AnnotationRecord[]).map(parseRecord);
        anno.store.bulkAddAnnotation(annotations, true, Origin.REMOTE);
      } else {
        console.error('[Supabase] Loading initial annotations failed', error);
      }
    });
  }

  return {
    connect,
    destroy: () => {
      anno.off('createAnnotation', onCreateAnnotation);
      anno.off('deleteAnnotation', onDeleteAnnotation);
      anno.off('updateAnnotation', onUpdateAnnotation);
    }
  }

}