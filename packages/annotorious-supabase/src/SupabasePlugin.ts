import { createNanoEvents } from 'nanoevents';
import type { Annotation, AnnotationLayer } from '@annotorious/core';
import { RealtimeChannel, RealtimeClient } from '@supabase/realtime-js';
import { BroadcastConnector } from './broadcast/BroadcastConnector';
import { PresenceConnector } from './presence/PresenceConnector';
import type { SupabasePluginConfig } from './SupabasePluginConfig';
import type { SupabasePluginEvents } from './SupabasePluginEvents';
import { PostgresConnector } from './postgres/PostgresConnector';

export const SupabasePlugin = (anno: AnnotationLayer<Annotation>, config: SupabasePluginConfig) => {

  const { base, apiKey, eventsPerSecond } = config;

  const emitter = createNanoEvents<SupabasePluginEvents>();

  let client: RealtimeClient = null;

  let channel: RealtimeChannel = null;

  let broadcast = null;

  let presence = null;
  
  let postgres = null;

  const connect = () => new Promise((resolve, reject) => {
    if (client)
      throw 'Client already connected';

    client = new RealtimeClient(`wss://${base}/realtime/v1`, {
      params: {
        apikey: apiKey,
        eventsPerSecond: eventsPerSecond || 10,
      }
    });
  
    channel = client.channel(config.channel);

    broadcast = BroadcastConnector(anno, channel);

    postgres = PostgresConnector(anno, config, channel);

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        // TODO refactor, so we can move this out of the subscribe handler
        presence = PresenceConnector(anno, channel, emitter);
      }
    });  
  });

  const disconnect = () => {
    broadcast?.destroy();
    presence?.destroy();
    postgres?.destroy();

    if (client && channel)
      client.removeChannel(channel);
  }

  const on = <E extends keyof SupabasePluginEvents>(event: E, callback: SupabasePluginEvents[E]) =>
    emitter.on(event, callback);

  return {
    connect,
    disconnect,
    on
  }

}