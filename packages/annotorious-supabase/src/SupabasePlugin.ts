import { createNanoEvents } from 'nanoevents';
import { PRESENCE_KEY } from '@annotorious/core';
import type { Annotation, AnnotationLayer, } from '@annotorious/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { SupabasePluginConfig } from './SupabasePluginConfig';
import type { SupabasePluginEvents } from './SupabasePluginEvents';
import { BroadcastConnector } from './broadcast';
import { PostgresConnector } from './postgres';
import { PresenceConnector } from './presence';

export const SupabasePlugin = <T extends Annotation>(anno: AnnotationLayer<T>, config: SupabasePluginConfig) => {

  const emitter = createNanoEvents<SupabasePluginEvents>();

  const { apiKey, base, eventsPerSecond } = config;

  // Create Supabase client
  const supabase = createClient(`https://${base}`, apiKey, {
    realtime: {
      params: {
        eventsPerSecond: eventsPerSecond || 10,
      }
    }
  });

  // Set up channel and connectors for each channel type
  let channel: RealtimeChannel = null;
  
  const presence = PresenceConnector(anno, emitter);

  const broadcast = BroadcastConnector(anno, presence);
  
  const postgres = PostgresConnector(anno, supabase, presence, emitter);

  // Creates the channel and inits all connectors
  const init = () => {
    channel = supabase.channel(config.channel, {
      config: {
        presence: {
          key: PRESENCE_KEY
        }
      }
    });

    presence.connect(channel);
    broadcast.connect(channel);
    postgres.connect(channel);

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED')
        presence.trackUser();
    });  
  }

  // Will check if user is logged in, and fail otherwise
  const connect = () => new Promise((resolve, reject) => {
    if (channel)
      reject('Connection already established');

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        // Update Annotorious identity with Supbase identity
        anno.setUser({ 
          id: data.user.id,
          email: data.user.email
        });

        init();

        resolve(anno.getUser());
      } else {
        reject('No credentials - user signed out.');
      }
    });

    supabase.auth.onAuthStateChange((event,session) => {
      // Note that sign-in events are also triggered it the same user opens a second tab
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const hasChanged = anno.getUser().id !== session.user.id;
        if (hasChanged) {
          anno.setUser({
            id: session.user.id,
            email: session.user.email
          });

          presence.trackUser(); 
        }
      }
    });
  });

  const on = <E extends keyof SupabasePluginEvents>(event: E, callback: SupabasePluginEvents[E]) =>
    emitter.on(event, callback);

  const destroy = () => {
    presence?.destroy();
    broadcast?.destroy();
    postgres?.destroy();

    if (channel)
      supabase.removeChannel(channel);
  }

  return {
    auth: supabase.auth,
    connect,
    destroy,
    on
  }

}