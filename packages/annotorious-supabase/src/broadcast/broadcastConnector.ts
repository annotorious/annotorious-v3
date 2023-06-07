import { Origin } from '@annotorious/core';
import { Annotation, Annotator, PRESENCE_KEY, StoreChangeEvent } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { PresenceConnector } from '../presence';
import { affectedAnnotations, apply, marshal } from './broadcastProtocol';
import type { BroadcastMessage } from './Types';

export const BroadcastConnector = (anno: Annotator<Annotation>, presence: ReturnType<typeof PresenceConnector>) => {

  let privacyMode = false;

  let observer: (event: StoreChangeEvent<Annotation>) => void  = null;

  const onStoreChange = (channel: RealtimeChannel) => ((event: StoreChangeEvent<Annotation>) =>  {
    // Don't broadcast when in private mode
    if (privacyMode)
      return;

    const message: BroadcastMessage = {
      from: { presenceKey: PRESENCE_KEY, ...anno.getUser() },
      events: marshal([ event ], anno.store)
    };

    // Not all store changes trigger broadcast events - make
    // sure we only send a message when there are >0 events!
    if (message.events.length > 0) {
      channel.send({
        type: 'broadcast',
        event: 'change',
        payload: message
      });
    }
  });

  const connect = (channel: RealtimeChannel) => {
    if (observer)
      throw 'Supabase realtime: already connected';

    // Link store change events to Supabase RT message channel
    observer = onStoreChange(channel);

    anno.store.observe(observer, { origin: Origin.LOCAL });

    // Listen to RT channel broadcast events
    channel.on('broadcast', { event: 'change' }, event => {
      const { from, events } = event.payload as BroadcastMessage;

      console.log('[Broadcast Rx]', events);

      // Apply the change event to the store
      events.forEach(event => apply(anno.store, event));

      // Notify presence state about user activity
      presence.notifyActivity(from.presenceKey, affectedAnnotations(events));
    });
  }

  return {
    connect,
    destroy: () => observer && anno.store.unobserve(observer),
    get privacyMode() {
      return privacyMode;
    },
    set privacyMode(mode: boolean) {
      privacyMode = mode;
    }
  }

}