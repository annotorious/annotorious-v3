import { Annotation, AnnotationLayer, ChangeType, Origin, StoreChangeEvent } from '@annotorious/core';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabasePluginConfig } from 'src/SupabasePluginConfig';

const DEBOUNCE_DELAY_MS = 1000;

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, config: SupabasePluginConfig, channel: RealtimeChannel) => {

  const client = createClient(`https://${config.base}`, config.apiKey);

  const { store } = anno;

  let debounceTimer: ReturnType<typeof setTimeout> = null;

  let debouncedChanges = [];

  const onStoreChange = ((event: StoreChangeEvent<Annotation>) =>  {
    const { added } = event.changes;

    // For this hack, ignore everything except create events
    if (added.length > 0) {
      clearTimeout(debounceTimer);

      // TODO batch changes instead of just pushing to the list    
      debouncedChanges.push(event);

      debounceTimer = setTimeout(() => { 
        // Just a hack for now
        console.log('[PG Tx] Sending DB update');
        const firstAdded = added[0];

        // TODO POST annotation + target
        console.log('inserting', firstAdded);

        client
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

  anno.store.observe(onStoreChange, { affects: ChangeType.BOTH, origin: Origin.LOCAL });

  channel.on('postgres_changes', { event: '*', schema: 'public'}, (payload) => {
    console.log('[PG Rx]', payload);
  });

  return {
    destroy: () => { 
      anno.store.unobserve(onStoreChange);
      // TODO clean up client
    }
  }

}
