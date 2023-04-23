import { Origin } from '@annotorious/core';
import { Annotation, AnnotationLayer, PRESENCE_KEY, StoreChangeEvent } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from '../SupabasePluginEvents';
import { apply, marshal } from './broadcastProtocol';
import type { BroadcastChangeMessage, BroadcastSelectMessage } from './Types';

export const BroadcastConnector = (anno: AnnotationLayer<Annotation>, emitter: Emitter<SupabasePluginEvents>) => {

  let observer: (event: StoreChangeEvent<Annotation>) => void  = null;

  const onStoreChange = (channel: RealtimeChannel) => ((event: StoreChangeEvent<Annotation>) =>  {
    const message: BroadcastChangeMessage = {
      from: { presenceKey: PRESENCE_KEY, ...anno.getUser() },
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

    // Link selection events to Supabase RT message channel
    anno.on('selectionChanged', selection => {
      const message: BroadcastSelectMessage = {
        from: { presenceKey: PRESENCE_KEY, ...anno.getUser() },
        ids: selection && selection.length > 0 ?
          selection.map(a => a.id) : null
        };
  
      channel.send({
        type: 'broadcast',
        event: 'select',
        payload: message
      });
    });

    // Listen to RT channel broadcast events
    channel.on('broadcast', { event: 'change' }, event => {
      const { events } = event.payload as BroadcastChangeMessage;
      events.forEach(event => apply(anno.store, event));
    });

    channel.on('broadcast', { event: 'select' }, event => {
      const selectEvent = (event.payload as BroadcastSelectMessage);
      emitter.emit('selectionChanged', selectEvent.from, selectEvent.ids);
    });
  }

  return {
    connect,
    destroy: () => observer && anno.store.unobserve(observer)
  }

}