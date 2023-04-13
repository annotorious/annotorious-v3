import { createPresenceState } from '@annotorious/core';
import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';

export const PresenceConnector = () => {

  const presence = createPresenceState();

  let channel: RealtimeChannel;

  const connect = (anno: AnnotationLayer<Annotation>, c: RealtimeChannel) => {
    channel = c;

    // Register my own presence first
    channel.track({
      user: anno.getUser()
    }).then(status => {
      if (status !== 'ok')
        throw 'Error syncing presence state';

      // ...then start listening to presence state changes
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user: User }>();
        
        const presentUsers = Object.entries(state).map(([presenceKey, state]) => ({
          presenceKey, user: state[0].user
        }));
        
        presence.syncUsers(presentUsers);
      });

      /*
      channel.on('broadcast', { event: 'change' }, event =>
        presence.notify(event.payload as BroadcastMessage));
      */
    });
  }

  const setUser = (user: User) => {    
    if (channel) {
      channel.track({ user });
    }
  }

  return {
    connect,
    destroy: () => { /* Nothing to clean up. For future use. */ },
    on: presence.on,
    setUser
  }

}