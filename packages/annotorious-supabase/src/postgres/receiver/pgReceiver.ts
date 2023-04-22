import type { Annotation, AnnotationLayer } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { parseTargetRecord } from '../pgCrosswalk';
import type { ChangeEvent } from '../Types';

export const createReceiver = (anno: AnnotationLayer<Annotation>, channel: RealtimeChannel) => {

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
  
}