import type { Annotation, AnnotationLayer } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, channel: RealtimeChannel) => {

  const onCreateAnnotation = (a: Annotation) => {
    console.log('created', a);

    // Just a hack for testing
    supabase
      .from('annotations')
      .insert({ 
        id: a.id,
        created_at: new Date()
      }).then(res => {
        console.log('supabase returned', res);
      });
  }

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
