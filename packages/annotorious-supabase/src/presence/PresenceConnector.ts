import type { Annotation, AnnotationLayer, User } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from '../SupabasePluginEvents';

export const PresenceConnector = (anno: AnnotationLayer<Annotation>, channel: RealtimeChannel, emitter: Emitter<SupabasePluginEvents>) => {

  // Register my own presence first...
  channel.track({
    user: anno.getUser()
  }).then(status => {
    if (status !== 'ok')
      throw 'Error syncing presence state';

    // ...then start listening to presence state changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ user: User }>();

      const others = 
        Object.values(state)
          .reduce((users, next) => ([...users, ...next]), [])
          .map(p => p.user)
          .filter(({ id }) => id !== anno.getUser().id);

      emitter.emit('presence', others);
    });
  });

  return {
    destroy: () => { /* Nothing to clean up. For future use. */ }
  }

}