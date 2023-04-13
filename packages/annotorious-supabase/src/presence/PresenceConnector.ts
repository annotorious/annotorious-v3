import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import { createPresenceState } from './Presence';
import type { BroadcastMessage } from 'src/broadcast/BroadcastMessage';

export const PresenceConnector = () => {

  const presence = createPresenceState();

  const connect = (anno: AnnotationLayer<Annotation>, channel: RealtimeChannel) => {
    // Register my own presence first
    channel.track({
      user: anno.getUser()
    }).then(status => {
      if (status !== 'ok')
        throw 'Error syncing presence state';

      // ...then start listening to presence state changes
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user: User }>();

        console.log(state);

        const others = 
          Object.values(state)
            .reduce((users, next) => ([...users, ...next]), [])
            .map(p => p.user)
            .filter(({ id }) => id !== anno.getUser().id);

        presence.syncUsers(others);
      });

      channel.on('broadcast', { event: 'change' }, event =>
        presence.notify(event.payload as BroadcastMessage));
    });
  }

  return {
    connect,
    destroy: () => { /* Nothing to clean up. For future use. */ },
    on: presence.on
  }

}