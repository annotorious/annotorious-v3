import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Annotation, AnnotationLayer, AnnotationTarget, Origin, User } from '@annotorious/core';
import equal from 'deep-equal';
import type { AnnotationRecord, ChangeEvent, ProfileRecord } from './Types';
import { parseProfileRecord, parseRecord, parseTargetRecord } from './pgCrosswalk';
import { pgOps } from './pgOps';

const hasTargetChanged = (oldValue: Annotation, newValue: Annotation) => 
  !equal(oldValue.target, newValue.target);

const bodiesAdded = (oldValue: Annotation, newValue: Annotation, anno: AnnotationLayer<Annotation>) => {
  const oldBodyIds = new Set(oldValue.bodies.map(b => b.id));

  const added = newValue.bodies.filter(b => !oldBodyIds.has(b.id));

  if (added.some(b => b.creator.id !== anno.getUser().id)) {
    console.error('Integrity exception: invalid creator on added body', added);
    console.error('Current user:', anno.getUser());
    throw 'Integrity exception: invalid creator on added body';
  }

  return added;
}

const bodiesRemoved = (oldValue: Annotation, newValue: Annotation) => {
  const newBodyIds = new Set(oldValue.bodies.map(b => b.id));
  return oldValue.bodies.filter(b => !newBodyIds.has(b.id));
}

const bodiesChanged = (oldValue: Annotation, newValue: Annotation, anno: AnnotationLayer<Annotation>) => 
  newValue.bodies.filter(newBody => {
    const oldBody = oldValue.bodies.find(b => b.id === newBody.id);
    return oldBody ? !equal(oldBody, newBody) : false;
  });

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
    if (hasTargetChanged(previous, a))
      ops.updateTarget(a.target).then(() => console.log('updated', previous, 'with', a));

    const add = bodiesAdded(previous, a, anno);
    const drop = bodiesRemoved(previous, a);
    const update = bodiesChanged(previous, a, anno);

    console.log('Body updates:', { add, drop, update });

    // TODO
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
