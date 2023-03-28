import { Annotation, AnnotationLayer, Origin, StoreChangeEvent } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEBOUNCE_DELAY_MS = 1000;

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, channel: RealtimeChannel) => {

  let debounceTimer: ReturnType<typeof setTimeout> = null;

  let debouncedChanges = [];

  const onStoreChange = ((event: StoreChangeEvent<Annotation>) =>  {
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

  anno.store.observe(onStoreChange, { origin: Origin.LOCAL });

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
    destroy: () => anno.store.unobserve(onStoreChange)
  }

}
