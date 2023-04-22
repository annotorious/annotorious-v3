import { createPresenceState } from '@annotorious/core';
import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from '../SupabasePluginEvents';

export const PresenceConnector = (anno: AnnotationLayer<Annotation>, emitter: Emitter<SupabasePluginEvents>) => {

  let channel: RealtimeChannel;

  const presence = createPresenceState();

  // Forward presence events
  presence.on('presence', users => emitter.emit('presence', users));
  presence.on('selectionChange', user => emitter.emit('selectionChange', user));

  const trackUser = () => {    
    if (channel)
      channel.track({ user: anno.getUser() });
  }

  const connect = (c: RealtimeChannel) => {
    channel = c;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ user: User }>();
      
      const presentUsers = Object.entries(state).map(([presenceKey, state]) => ({
        presenceKey, user: state[0].user
      }));
      
      presence.syncUsers(presentUsers);
    });

    trackUser();
  }

  return {
    connect,
    destroy: () => channel && channel.untrack(),
    trackUser
  }

}