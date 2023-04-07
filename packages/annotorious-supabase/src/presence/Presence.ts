import type { User } from '@annotorious/core';
import { createNanoEvents } from 'nanoevents';
import type { PresenceEvents } from './PresenceEvents';
import type { BroadcastMessage } from '../broadcast/BroadcastMessage';
import { BroadcastEventType } from '../broadcast/BroadcastMessage';

const SEABORN_BRIGHT = [
  '#ff7c00', // orange
  '#1ac938', // green
  '#e8000b', // red
  '#8b2be2', // purple
  '#9f4800', // brown
  '#f14cc1', // pink
  '#ffc400', // khaki
  '#00d7ff', // cyan
  '#023eff'  // blue
];

export interface UserPresenceState  {

  user: User;

  color: string;

  selection?: string | string[];

}

const equalValues = (a: string[], b: string[]) => 
  a.every(str => b.includes(str)) && b.every(str => a.includes(str));

export const createPresenceState = () => {

  const emitter = createNanoEvents<PresenceEvents>();

  const userStates = new Map<string, UserPresenceState>();

  const unassignedColors = [...SEABORN_BRIGHT];

  const assignRandomColor = () => {
    const rnd = Math.floor(Math.random() * unassignedColors.length);
    const color = unassignedColors[rnd];

    unassignedColors.splice(rnd, 1);

    return color;
  }

  const addOne = (user: User) => {
    if (userStates.has(user.id)) {
      console.warn('Attempt to add user that is already present', user);
      return;    
    }

    const color = assignRandomColor();

    userStates.set(user.id, { user, color });
  }

  const addUser = (user: User) => {
    addOne(user);
    emitter.emit('presence', getPresentUsers());
  }

  const removeOne = (userId: string) => {
    const state = userStates.get(userId);
    if (!state) {
      console.warn('Attempt to remove user that was not present', userId);
      return;
    }

    unassignedColors.push(state.color);
    userStates.delete(userId);
  }

  const removeUser = (userId: string) => {
    const state = userStates.get(userId);
    if (state?.selection)
      emitter.emit('selectionChange', state, null);

    removeOne(userId);
    emitter.emit('presence', getPresentUsers());
  }

  const syncUsers = (users: User[]) => {
    const toAdd = users.filter(user => !userStates.has(user.id));

    const toRemove = Array.from(userStates.values()).filter(state =>
      !users.map(u => u.id).includes(state.user.id));

    const toDeselect = toRemove.filter(state => state.selection);
    toDeselect.forEach(state => emitter.emit('selectionChange', state, null));

    toAdd.forEach(addOne);
    toRemove.forEach(state => removeOne(state.user.id));

    if (toAdd.length > 0 || toRemove.length > 0)
      emitter.emit('presence', getPresentUsers());
  }

  const notify = (message: BroadcastMessage) => {
    const { from, events } = message;

    const userState = userStates.get(from.id);
    if (!userState) {
      console.warn('Got message from user who is not registered as present', from);
      // TODO update presence
      return;
    }

    const updated = events.reduce((ids, event) => {
      if (event.type === BroadcastEventType.CREATE_ANNOTATION) {
        return [...ids, event.annotation.id];
      } else if (event.type === BroadcastEventType.CREATE_BODY || event.type === BroadcastEventType.UPDATE_BODY) {
        return [...ids, event.body.annotation];
      } else if (event.type === BroadcastEventType.DELETE_BODY) {
        return [...ids, event.annotation];
      } else if (event.type === BroadcastEventType.UPDATE_TARGET) {
        return [...ids, event.target.annotation];
      } else {
        return ids;
      }
    }, []);

    const currentSelection: string[] = Array.isArray(userState.selection || []) ? 
      userState.selection as string[] || [] : [ userState.selection as string ];

    if (equalValues(currentSelection, updated))
      // No selection change
      return;

    if (updated.length === 0) {
      userStates.set(userState.user.id, {...userState, selection: undefined });
    } else if (updated.length === 1) {
      userStates.set(userState.user.id, {...userState, selection: updated[0] });
    } else {
      userStates.set(userState.user.id, {...userState, selection: updated });
    }

    emitter.emit('selectionChange', userState, userStates.get(userState.user.id).selection);
  }

  const updateSelection = (user: User, selected: string[]) => {
    const userState = userStates.get(user.id);
    if (!userState) {
      console.warn('Attempt to update selection for user who is not registered as present');
      // TODO update presence
      return;
    }

    let updated: string | string[] | undefined;
    if (!selected || selected?.length === 0)
      updated = undefined;
    else if (selected.length === 1)
      updated = selected[0];
    else
      updated = selected;

    userStates.set(user.id, { ...userState, selection: updated });

    emitter.emit('selectionChange', userState, updated);
  }

  const getPresentUsers = () =>
    [...Array.from(userStates.values())];
    
  const on = <E extends keyof PresenceEvents>(event: E, callback: PresenceEvents[E]) =>
    emitter.on(event, callback);

  return {
    addUser,
    getPresentUsers,
    notify,
    on,
    removeUser,
    syncUsers,
    updateSelection
  }

}