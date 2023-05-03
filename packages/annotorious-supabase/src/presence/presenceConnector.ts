import { createPresenceState, PRESENCE_KEY } from '@annotorious/core';
import type { Annotator, User } from '@annotorious/core';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { Emitter } from 'nanoevents';
import type { SupabasePluginEvents } from '../SupabasePluginEvents';
import type { SelectEvent } from './Types';

export const PresenceConnector = (anno: Annotator, emitter: Emitter<SupabasePluginEvents>) => {

  let channel: RealtimeChannel;

  const presence = createPresenceState();

  // Forward presence events
  presence.on('presence', users => emitter.emit('presence', users));
  presence.on('selectionChange', (from, selection) => emitter.emit('selectionChange', from, selection));

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

    // Link selection events to Supabase RT message channel
    anno.on('selectionChanged', selection => {
      const event: SelectEvent = {
        from: { presenceKey: PRESENCE_KEY, ...anno.getUser() },
        ids: selection && selection.length > 0 ? selection.map(a => a.id) : null
      };
  
      channel.send({
        type: 'broadcast',
        event: 'select',
        payload: event
      });
    });

    channel.on('broadcast', { event: 'select' }, event => {
      const { from, ids } = (event.payload as SelectEvent);
      presence.updateSelection(from.presenceKey, ids);
    });
  }

  return {
    connect,
    getPresentUsers: presence.getPresentUsers,
    destroy: () => channel && channel.untrack(),
    notifyActivity: presence.notifyActivity,
    trackUser
  }

}