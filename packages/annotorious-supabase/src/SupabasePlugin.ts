import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { BroadcastConnector } from './broadcast/BroadcastConnector';
import { PresenceConnector } from './presence/PresenceConnector';
import type { SupabasePluginConfig } from './SupabasePluginConfig';
import { PostgresConnector } from './postgres/PostgresConnector';
import { createAuth } from './auth/auth';
import { PRESENCE_KEY } from './presence/Presence';

export const SupabasePlugin = <T extends Annotation>(anno: AnnotationLayer<T>, config: SupabasePluginConfig) => {

  const { base, apiKey, eventsPerSecond } = config;

  const supabase = createClient(`https://${base}`, apiKey, {
    realtime: {
      params: {
        eventsPerSecond: eventsPerSecond || 30,
      }
    }
  });

  const auth = createAuth(supabase);

  let channel: RealtimeChannel = null;

  let broadcast = null;
  
  let postgres = null;

  const presence = PresenceConnector();

  const connect = () => new Promise((resolve, reject) => {
    if (channel)
      throw 'Connection already established';

    channel = supabase.channel(config.channel, {
      config: {
        presence: {
          key: PRESENCE_KEY
        }
      }
    });

    // const auth = createAuth(supabase);

    // auth.checkStatusAndSignIn('aboutgeo@gmail.com').then(user => {
      broadcast = BroadcastConnector(anno, channel);

      postgres = PostgresConnector(anno, supabase, channel);
  
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          // TODO refactor, so we can move this out of the subscribe handler
          presence.connect(anno, channel);
        }
      });  
    // });
  });

  const setUser = (user: User) => presence.setUser(user);

  const disconnect = () => {
    broadcast?.destroy();
    presence?.destroy();
    postgres?.destroy();

    if (channel)
      supabase.removeChannel(channel);
  }

  return {
    auth,
    connect,
    disconnect,
    on: presence.on,
    setUser
  }

}