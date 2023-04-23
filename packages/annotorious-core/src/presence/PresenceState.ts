import { nanoid } from 'nanoid';
import { createNanoEvents } from 'nanoevents';
import type { User } from '../model';
import { PALETTE } from './Palette';
import type { PresentUser } from './PresentUser';
import type { PresenceEvents } from './PresenceEvents';

// This client's presence key
export const PRESENCE_KEY = nanoid();

export const createPresenceState = () => {

  const emitter = createNanoEvents<PresenceEvents>();

  const presentUsers = new Map<string, PresentUser>();

  const unassignedColors = [...PALETTE];

  const assignRandomColor = () => {
    const rnd = Math.floor(Math.random() * unassignedColors.length);
    const color = unassignedColors[rnd];

    unassignedColors.splice(rnd, 1);

    return color;
  }

  const addUser = (presenceKey: string, user: User) => {
    if (presentUsers.has(presenceKey)) {
      console.warn('Attempt to add user that is already present', presenceKey, user);
      return;    
    }

    const color = assignRandomColor();

    const lastActive = new Date();

    presentUsers.set(presenceKey, { presenceKey, user, color, lastActive });
  }

  const removeUser = (presenceKey: string) => {
    const state = presentUsers.get(presenceKey);
    if (!state) {
      console.warn('Attempt to remove user that was not present', presenceKey);
      return;
    }

    unassignedColors.push(state.color);

    presentUsers.delete(presenceKey);
  }

  const syncUsers = (state: { presenceKey: string, user: User }[]) => {
    // Presence state includes this users own key - remove
    const others = state.filter(({ presenceKey }) => presenceKey !== PRESENCE_KEY);

    const keys = new Set(others.map(s => s.presenceKey));

    // These users need to be added to the presentUsers list
    const toAdd = others.filter(({ presenceKey }) => !presentUsers.has(presenceKey));

    // These users need to be dropped from the list
    const toRemove = Array.from(presentUsers.values()).filter(presentUser =>
      !keys.has(presentUser.presenceKey));

    toAdd.forEach(({ presenceKey, user }) => addUser(presenceKey, user));

    toRemove.forEach(({ presenceKey }) => removeUser(presenceKey));

    if (toAdd.length > 0 || toRemove.length > 0)
      emitter.emit('presence', getPresentUsers());
  }

  const getPresentUsers = () =>
    [...Array.from(presentUsers.values())];
    
  const on = <E extends keyof PresenceEvents>(event: E, callback: PresenceEvents[E]) =>
    emitter.on(event, callback);

  return {
    getPresentUsers,
    on,
    syncUsers
  }

}