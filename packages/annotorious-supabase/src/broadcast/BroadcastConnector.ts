import { Origin } from '@annotorious/core';
import type { Annotation, AnnotationLayer, StoreChangeEvent } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import { apply, marshal, reviveDates } from './BroadcastProtocol';
import type { BroadcastMessage } from './BroadcastMessage';

export const BroadcastConnector = (anno: AnnotationLayer<Annotation>, channel: RealtimeChannel) => {

  const onStoreChange = ((event: StoreChangeEvent<Annotation>) =>  {
    const message = {
      from: 'test-user-1',
      events: marshal([ event ])
    };

    // console.log('[Tx]', message);

    channel.send({
      type: 'broadcast',
      event: 'change',
      payload: message
    });
  })

  anno.store.observe(onStoreChange, { origin: Origin.LOCAL });

  channel.on('broadcast', { event: 'change' }, event => {
    // console.log('[Rx]', event);
    
    const { from, events } = event.payload as BroadcastMessage;
    events.forEach(event => apply(anno.store, reviveDates(event)));
  });

  return {
    destroy: () => anno.store.unobserve(onStoreChange)
  }

}