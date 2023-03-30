import { createNanoEvents } from 'nanoevents';
import type { Annotation, AnnotationLayer } from '@annotorious/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js';
import { BroadcastConnector } from './broadcast/BroadcastConnector';
import { PresenceConnector } from './presence/PresenceConnector';
import type { SupabasePluginConfig } from './SupabasePluginConfig';
import type { SupabasePluginEvents } from './SupabasePluginEvents';
import { PostgresConnector } from './postgres/PostgresConnector';
// import { createAuth } from './auth/auth';

export const SupabasePlugin = (anno: AnnotationLayer<Annotation>, config: SupabasePluginConfig) => {

  const { base, apiKey, eventsPerSecond } = config;

  const emitter = createNanoEvents<SupabasePluginEvents>();

  let supabase: SupabaseClient = null;

  let realtime: RealtimeClient = null;

  let channel: RealtimeChannel = null;

  let broadcast = null;

  let presence = null;
  
  let postgres = null;

  const connect = () => new Promise((resolve, reject) => {
    if (supabase)
      throw 'Client already connected';

    if (realtime)
      throw 'Realtime connection already established';

    supabase = createClient(`https://${config.base}`, config.apiKey);

    realtime = new RealtimeClient(`wss://${base}/realtime/v1`, {
      params: {
        apikey: apiKey,
        eventsPerSecond: eventsPerSecond || 30,
      }
    });

    channel = realtime.channel(config.channel);

    // const auth = createAuth(supabase);

    // auth.checkStatusAndSignIn('aboutgeo@gmail.com').then(user => {
      broadcast = BroadcastConnector(anno, channel);

      postgres = PostgresConnector(anno, supabase, channel);
  
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          // TODO refactor, so we can move this out of the subscribe handler
          presence = PresenceConnector(anno, channel, emitter);
        }
      });  
    // });
  });

  const disconnect = () => {
    broadcast?.destroy();
    presence?.destroy();
    postgres?.destroy();

    if (realtime && channel)
      realtime.removeChannel(channel);
  }

  const on = <E extends keyof SupabasePluginEvents>(event: E, callback: SupabasePluginEvents[E]) =>
    emitter.on(event, callback);

  return {
    connect,
    disconnect,
    on
  }

}