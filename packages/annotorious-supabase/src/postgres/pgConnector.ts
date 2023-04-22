import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Annotation, AnnotationLayer } from '@annotorious/core';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from '../SupabasePluginEvents';
import { createReceiver } from './receiver';
import { createSender } from './sender';

export const PostgresConnector = (anno: AnnotationLayer<Annotation>, supabase: SupabaseClient, emitter: Emitter<SupabasePluginEvents>) => {

  let sender: ReturnType<typeof createSender> | undefined;

  let receiver: ReturnType<typeof createReceiver> | undefined;

  const connect = (channel: RealtimeChannel) => {
    sender = createSender(anno, supabase, emitter);
    receiver = createReceiver(anno, channel, emitter);
  }

  return {
    connect,
    destroy: () => {
      sender?.destroy();
    }
  }

}