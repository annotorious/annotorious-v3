import type { Annotation, AnnotationLayer } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEBOUNCE_DELAY_MS = 1000;

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, channel: RealtimeChannel) => {

  let debounceTimer: ReturnType<typeof setTimeout> = null;

  let debouncedChanges = [];

  /*
  const onLifecycleEvent = (event =>  {
    const { created } = event.changes;

    // For this hack, ignore everything except create events
    if (created.length > 0) {
      clearTimeout(debounceTimer);

      // TODO batch changes instead of just pushing to the list    
      debouncedChanges.push(event);

      debounceTimer = setTimeout(() => { 
        // Just a hack for now
        console.log('[PG Tx] Sending DB update');
        const firstAdded = created[0];

        // TODO POST annotation + target
        console.log('inserting', firstAdded);

        supabase
          .from('annotations')
          .insert({ 
            id: firstAdded.id,
            created_at: new Date()
          }).then(res => {
            console.log('supabase returned', res);
          });

      }, DEBOUNCE_DELAY_MS);
    }
  });
  */

  const onCreateSelection = (a: Annotation) => {
    console.log('created selection', a);
  }

  const onCreateAnnotation = (a: Annotation) => {
    console.log('created', a);
  }

  const onDeleteAnnotation = (a: Annotation) => {
    console.log('deleted', a);
  }

  const onUpdateAnnotation = (a: Annotation, previous: Annotation) => {
    console.log('updated', previous, 'with', a);
  }

  anno.on('createSelection', onCreateSelection);
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
      anno.off('createAnnotation', onCreateSelection);
      anno.off('createAnnotation', onCreateAnnotation);
      anno.off('deleteAnnotation', onDeleteAnnotation);
      anno.off('updateAnnotation', onUpdateAnnotation);
    }
  }

}
