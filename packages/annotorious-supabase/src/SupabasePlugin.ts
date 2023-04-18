import { PRESENCE_KEY } from '@annotorious/core';
import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { BroadcastConnector } from './broadcast';
import { PresenceConnector } from './presence';
import type { SupabasePluginConfig } from './SupabasePluginConfig';
import { PostgresConnector } from './postgres';

export const SupabasePlugin = <T extends Annotation>(anno: AnnotationLayer<T>, config: SupabasePluginConfig) => {

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

  const broadcast = BroadcastConnector(anno);
  
  const presence = PresenceConnector(anno);
  
  const postgres = PostgresConnector(anno, supabase);

  // Update Annotorious identity with Supbase identity
  supabase.auth.getUser().then(({ data }) => {
    if (data?.user) {
      anno.setUser({ 
        id: data.user.id,
        email: data.user.email
      });

      if (presence.isConnected())
        presence.trackUser();
    } else {
      console.warn('[Supabase] no credentials - user signed out.');
    }
  });

  supabase.auth.onAuthStateChange((event,session) => {
    // Note that sign-in events are also triggered it the same user opens a second tab
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      const hasChanged = anno.getUser().id !== session.user.id;
      if (hasChanged) {
        const { user } = session;

        anno.setUser({
          id: user.id,
          email: user.email
        });

        if (presence.isConnected())
          presence.trackUser(); 
      }
    }
  });

  const connect = () => {
    if (channel)
      throw 'Connection already established';

    channel = supabase.channel(config.channel, {
      config: {
        presence: {
          key: PRESENCE_KEY
        }
      }
    });

    broadcast.connect(channel);
    presence.connect(channel);
    postgres.connect(channel);

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED')
        presence.trackUser();
    });  
  }

  const destroy = () => {
    broadcast?.destroy();
    presence?.destroy();
    postgres?.destroy();

    if (channel)
      supabase.removeChannel(channel);
  }

  return {
    auth: supabase.auth,
    connect,
    destroy,
    on: presence.on
  }

}