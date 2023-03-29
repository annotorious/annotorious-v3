import { writable } from 'svelte/store';
import type { Annotation } from '../model';
import type { Store } from './Store';
   
export type Selection<T extends Annotation> = ReturnType<typeof createSelectionState<T>>;

export const createSelectionState = <T extends Annotation>(store: Store<T>) => {

  const { subscribe, set } = writable<string[]>(null);

  let currentSelection: string[] = null;

  subscribe(updated => currentSelection = updated);

  const clear = () => set(null);

  const isEmpty = () => !currentSelection || currentSelection.length === 0;

  const isSelected = (annotationOrId: T | string) => {
    if (!currentSelection)
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return currentSelection.some(i => i === id);
  }

  const clickSelect = (evt: PointerEvent, id: string) => {
    // TODO allow CTRL select
    set([id]);
  }

  const setSelected = (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    set(ids); 
  }

  const removeFromSelection = (ids: string[]) => {
    if (!currentSelection)
      return;

    // Checks which of the given annotations are actually in the selection
    const toRemove = currentSelection.filter(id => ids.includes(id))

    if (toRemove.length > 0)
      set(currentSelection.filter(id => !ids.includes(id)))
  }

  // Track store delete and update events
  store.observe(({ changes }) =>
    removeFromSelection(changes.deleted.map(a => a.id)));

  return { 
    clear, 
    clickSelect, 
    isEmpty, 
    isSelected, 
    setSelected, 
    subscribe 
  };

}