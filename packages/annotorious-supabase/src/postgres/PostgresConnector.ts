import type { AbstractSelector, Annotation, AnnotationBody, AnnotationLayer, AnnotationTarget } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const serializeSelector = (s: AbstractSelector) => {
  // TODO
  return 'foo';
}

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
      annotation_id: b.annotation,
      purpose: b.purpose,
      value: b.value
    });

  const createTarget = (t: AnnotationTarget) => supabase
    .from('targets')
    .insert({
      created_at: t.created,
      created_by: anno.getUser().id,
      annotation_id: t.annotation,
      value: serializeSelector(t)
    })

  const onCreateAnnotation = (a: Annotation) => createAnnotation(a)
    .then(() => createTarget(a.target))
    .then(({ error, status }) => {
      if (status !== 201) {
        console.error(error);
        throw 'Error storing annotation';
      }
    });

  const onDeleteAnnotation = (a: Annotation) => {
    console.log('deleted', a);
  }

  const onUpdateAnnotation = (a: Annotation, previous: Annotation) => {
    console.log('updated', previous, 'with', a);
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

  return {
    destroy: () => {
      anno.off('createAnnotation', onCreateAnnotation);
      anno.off('deleteAnnotation', onDeleteAnnotation);
      anno.off('updateAnnotation', onUpdateAnnotation);
    }
  }

}
