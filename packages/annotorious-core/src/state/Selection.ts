import { writable } from 'svelte/store';
import type { Annotation } from '../model';
import type { Store } from './Store';
   
export type SelectionState<T extends Annotation> = ReturnType<typeof createSelectionState<T>>;

export type Selection = {

  selected: string[],

  pointerEvent?: PointerEvent;

}

export const createSelectionState = <T extends Annotation>(store: Store<T>) => {

  const { subscribe, set } = writable<Selection>(null);

  let currentSelection: Selection = { selected: [] };

  subscribe(updated => currentSelection = updated);

  const clear = () => set(null);

  const isEmpty = () => !currentSelection || currentSelection.selected.length === 0;

  const isSelected = (annotationOrId: T | string) => {
    if (!currentSelection)
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return currentSelection.selected.some(i => i === id);
  }

  const clickSelect = (id: string, pointerEvent: PointerEvent) => {
    set({ selected: [id], pointerEvent }); // TODO allow CTRL select
  }

  const setSelected = (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    set({ selected: ids }); 
  }

  const removeFromSelection = (ids: string[]) => {
    if (!currentSelection)
      return;

    const { selected } = currentSelection;

    // Checks which of the given annotations are actually in the selection
    const toRemove = selected.filter(id => ids.includes(id))

    if (toRemove.length > 0)
      set({ selected: selected.filter(id => !ids.includes(id)) });
  }

  // Track store delete and update events
  store.observe(({ changes }) =>
    removeFromSelection(changes.deleted.map(a => a.id)));

  return { 
    clear, 
    clickSelect, 
    get selected() { return currentSelection ? [...currentSelection.selected ] : null},
    get pointerEvent() { return currentSelection ? currentSelection.pointerEvent : null },
    isEmpty, 
    isSelected, 
    setSelected, 
    subscribe 
  };

}