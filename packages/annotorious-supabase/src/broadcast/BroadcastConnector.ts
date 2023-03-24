import { Annotation, Origin } from '@annotorious/core';
import type { AnnotationLayer, StoreChangeEvent } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';

export const BroadcastConnector = (anno: AnnotationLayer<Annotation>, channel: RealtimeChannel) => {

  const onStoreChange = ((event: StoreChangeEvent<Annotation>) =>  {
    const { changes } = event;

    console.log('[Tx]', changes);

    channel.send({
      type: 'broadcast',
      event: 'change',
      payload: changes
    });
  })

  anno.store.observe(event => onStoreChange, { origin: Origin.LOCAL });

  channel.on('broadcast', { event: 'change' }, event => {
    const { updated } = event.payload;
    console.log('[Rx]', updated);

    const updatedTarget = updated[0].targetUpdated.newTarget;
    anno.store.updateTarget(updatedTarget, Origin.REMOTE);
  });

  return {
    destroy: () => anno.store.unobserve(onStoreChange)
  }

}