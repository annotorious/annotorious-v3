import { createPresenceState } from '@annotorious/core';
import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';

export const PresenceConnector = (anno: AnnotationLayer<Annotation>) => {

  let connected = false;

  const presence = createPresenceState();

  let channel: RealtimeChannel;

  const connect = (c: RealtimeChannel) => {
    connected = true;

    channel = c;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ user: User }>();
      
      const presentUsers = Object.entries(state).map(([presenceKey, state]) => ({
        presenceKey, user: state[0].user
      }));
      
      presence.syncUsers(presentUsers);
    });
  }

  const trackUser = () => {    
    if (channel)
      channel.track({ user: anno.getUser() });
  }

  const isConnected = () => isConnected;

  return {
    connect,
    destroy: () => channel && channel.untrack(),
    isConnected,
    on: presence.on,
    trackUser
  }

}