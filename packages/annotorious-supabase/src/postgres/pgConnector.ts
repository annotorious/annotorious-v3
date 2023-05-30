import type { RealtimeChannel } from '@supabase/realtime-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Annotator } from '@annotorious/core';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from '../SupabasePluginEvents';
import type { PresenceConnector } from '../presence';
import { createReceiver } from './receiver';
import { createSender } from './sender';

export const PostgresConnector = (anno: Annotator, layerId: string, supabase: SupabaseClient, presence: ReturnType<typeof PresenceConnector>, emitter: Emitter<SupabasePluginEvents>) => {

  let sender: ReturnType<typeof createSender> | undefined;

  let receiver: ReturnType<typeof createReceiver> | undefined;

  const connect = (channel: RealtimeChannel) => {
    sender = createSender(anno, layerId, supabase, emitter);
    receiver = createReceiver(anno, layerId, channel, presence, emitter);
  }

  return {
    connect,
    destroy: () => {
      sender?.destroy();
    }
  }

}