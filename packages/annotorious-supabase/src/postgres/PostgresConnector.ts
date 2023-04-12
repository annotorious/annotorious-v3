import type { Annotation, AnnotationBody, AnnotationLayer, AnnotationTarget } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import equal from 'deep-equal';

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

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, channel: RealtimeChannel) => {

  const createAnnotation = (a: Annotation) => supabase
    .from('annotations')
    .insert({
      id: a.id,
      created_at: new Date(),
      created_by: anno.getUser().id
    });

  const createBody = (b: AnnotationBody) => supabase
    .from('bodies')
    .insert({
      id: b.id,
      created_at: b.created,
      created_by: anno.getUser().id,
      updated_at: b.created,
      updated_by: anno.getUser().id,
      annotation_id: b.annotation,
      purpose: b.purpose,
      value: b.value
    });

  const createTarget = (t: AnnotationTarget) => supabase
    .from('targets')
    .insert({
      created_at: t.created,
      created_by: anno.getUser().id,
      updated_at: t.created,
      updated_by: anno.getUser().id,
      annotation_id: t.annotation,
      value: JSON.stringify(t.selector)
    });

  const updateTarget = (t: AnnotationTarget) => supabase
    .from('targets')
    .update({
      updated_at: t.updated,
      updated_by: anno.getUser().id,
      value: JSON.stringify(t.selector)
    })
    .eq('annotation_id', t.annotation);

  const onCreateAnnotation = (a: Annotation) => createAnnotation(a)
    .then(() => createTarget(a.target))
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
      updateTarget(a.target).then(() => console.log('updated', previous, 'with', a));

    const add = bodiesAdded(previous, a, anno);
    const drop = bodiesRemoved(previous, a);
    const update = bodiesChanged(previous, a, anno);

    console.log('Body updates:', { add, drop, update });

    // TODO
  }

  anno.on('createAnnotation', onCreateAnnotation);
  anno.on('deleteAnnotation', onDeleteAnnotation);
  anno.on('updateAnnotation', onUpdateAnnotation);

  channel.on(
    'postgres_changes', 
    { 
      event: '*', 
      schema: 'public'
    }, (payload) => {
      console.log('[PG Rx]', payload);

      /* Example message:
      {
        "schema": "public",
        "table": "annotations",
        "commit_timestamp": null,
        "eventType": "UPDATE",
        "new": {},
        "old": {},
        "errors": [
          "Error 401: Unauthorized"
        ]
      }
      */
    });

  // Initial load
  supabase.from('annotations').select(`
    id,
    created_at,
    created_by,
    updated_at,
    updated_by,
    version,
    targets ( 
      *,
      profiles!targets_created_by_fkey(*)
    ),
    bodies ( 
      *
    )
  `).then(({ data, error }) => {
    if (!error) {
      console.log('initial load', data);
     // anno.setAnnotations(data.map(toAnnotation))
    } else {
      console.error('Initial load failed', error);
    }
  })

  return {
    destroy: () => {
      anno.off('createAnnotation', onCreateAnnotation);
      anno.off('deleteAnnotation', onDeleteAnnotation);
      anno.off('updateAnnotation', onUpdateAnnotation);
    }
  }

}
