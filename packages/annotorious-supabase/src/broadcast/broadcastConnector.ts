import { Origin } from '@annotorious/core';
import type { Annotation, AnnotationLayer, StoreChangeEvent } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import { apply, marshal } from './broadcastProtocol';
import type { BroadcastMessage } from './Types';

export const BroadcastConnector = (anno: AnnotationLayer<Annotation>) => {

  let observer: (event: StoreChangeEvent<Annotation>) => void  = null;

  const onStoreChange = (channel: RealtimeChannel) => ((event: StoreChangeEvent<Annotation>) =>  {
    const message: BroadcastMessage = {
      from: anno.getUser(),
      events: marshal([ event ])
    };

    channel.send({
      type: 'broadcast',
      event: 'change',
      payload: message
    });
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
      events.forEach(event => apply(anno.store, event));
    });
  }

  return {
    connect,
    destroy: () => observer && anno.store.unobserve(observer)
  }

}