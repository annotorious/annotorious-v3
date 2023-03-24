import { writable } from 'svelte/store';
import type { Annotation } from '../model';
import type { Store } from './Store';

export const createSelectionState = <T extends Annotation>(store: Store<T>) => {

  const { subscribe, set } = writable<T[]>(null);

  let currentSelection: T[] = null;

  subscribe(updated => currentSelection = updated);

  const clear = () => set(null);

  const isEmpty = () => !currentSelection || currentSelection.length === 0;

  const isSelected = (annotationOrId: T | string) => {
    if (!currentSelection)
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return currentSelection.some(a => a.id === id);
  }

  const clickSelect = (evt: PointerEvent, id: string) => {
    // TODO allow CTRL select
    const annotation = store.getAnnotation(id);
    if (annotation)
      set([annotation]);
  }

  const setSelected = (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    set(ids.map(id => store.getAnnotation(id))); 
  }

  const removeFromSelection = (annotations: T[]) => {
    if (!currentSelection)
      return;

    const ids = new Set(annotations.map(a => a.id));

    // Checks which of the given annotations are actually in the selection
    const toRemove = currentSelection.filter(a => ids.has(a.id))

    if (toRemove.length > 0)
      set(currentSelection.filter(a => !ids.has(a.id)))
  }

  const updateInSelection = (oldValue: T, newValue: T) => {
    if (currentSelection && isSelected(oldValue))
      set(currentSelection.map(a => a.id === oldValue.id ? newValue : a));
  }

  // Track store delete and update events
  store.observe(({ changes }) => {    
    removeFromSelection(changes.deleted);
    
    changes.updated.forEach(({ oldValue, newValue }) =>
      updateInSelection(oldValue, newValue));
  });

  return { 
    clear, 
    clickSelect, 
    isEmpty, 
    isSelected, 
    setSelected, 
    subscribe 
  };

}