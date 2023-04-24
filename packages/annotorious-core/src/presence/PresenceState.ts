import { nanoid } from 'nanoid';
import { createNanoEvents } from 'nanoevents';
import type { User } from '../model';
import { PALETTE } from './Palette';
import type { PresentUser } from './PresentUser';
import type { PresenceEvents } from './PresenceEvents';

const isListEqual = (listA: any[], listB: any[]) => 
  listA.every(a => listA.includes(a)) && listB.every(b => listA.includes(b));

// This client's presence key
export const PRESENCE_KEY = nanoid();

export const createPresenceState = () => {

  const emitter = createNanoEvents<PresenceEvents>();

  const presentUsers = new Map<string, PresentUser>();

  const selectionStates = new Map<string, string[]>();

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

    presentUsers.set(presenceKey, { presenceKey, user, color });
  }

  const removeUser = (presenceKey: string) => {
    const state = presentUsers.get(presenceKey);
    if (!state) {
      console.warn('Attempt to remove user that is not present', presenceKey);
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

  const notifyActivity = (presenceKey: string, annotationIds: string[]) => {    
    const user = presentUsers.get(presenceKey);
    
    if (!user) {
      console.warn('Activity notification from user that is not present');
      return;
    }

    const currentSelection = selectionStates.get(presenceKey);

    // Was there a selection change we might have missed?
    if (!currentSelection || !isListEqual(currentSelection, annotationIds)) {
      selectionStates.set(presenceKey, annotationIds);
      emitter.emit('selectionChange', user, annotationIds);
    }
  }

  const updateSelection = (presenceKey: string, selection: string[] | null) => {
    const from = presentUsers.get(presenceKey);
    if (!from) {
      console.warn('Selection change for user that is not present', presenceKey);
      return;
    }

    if (selection)
      selectionStates.set(presenceKey, selection);
    else 
      selectionStates.delete(presenceKey);

    emitter.emit('selectionChange', from, selection);
  }

  const getPresentUsers = () =>
    [...Array.from(presentUsers.values())];
    
  const on = <E extends keyof PresenceEvents>(event: E, callback: PresenceEvents[E]) =>
    emitter.on(event, callback);

  return {
    getPresentUsers,
    notifyActivity,
    on,
    syncUsers,
    updateSelection
  }

}