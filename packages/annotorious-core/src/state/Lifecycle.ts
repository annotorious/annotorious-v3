import equal from 'deep-equal';
import type { Annotation } from '../model';
import type { Store } from './Store';
import { Origin } from './StoreObserver';
import type { Selection } from './Selection';

export type Lifecycle<T extends Annotation> = ReturnType<typeof createLifecyleObserver<T>>;

export interface LifecycleEvents<T extends Annotation> {

  createAnnotation: (annotation: T) => void;

  deleteAnnotation: (annotation: T) => void;

  updateAnnotation: (annotation: T, previous: T) => void;

}

export const createLifecyleObserver = <T extends Annotation>(selectionState: Selection<T>, store: Store<T> ) => {

  const observers = new Map<string, LifecycleEvents<T>[keyof LifecycleEvents<T>][]>();

  // The currently selected annotations, in the state 
  // when they were selected 
  let initialSelection: T[] = null;

  const on = <E extends keyof LifecycleEvents<T>>(event: E, callback: LifecycleEvents<T>[E]) => {
    if (observers.has(event)) {
      observers.get(event).push(callback);
    } else {
      observers.set(event, [callback]);
    }
  }

  const off = <E extends keyof LifecycleEvents<T>>(event: E, callback: LifecycleEvents<T>[E]) => {
    const callbacks = observers.get(event);
    if (callbacks)
      callbacks.splice(callbacks.indexOf(callback), 1);
  }

  const emit = (event: keyof LifecycleEvents<T>, arg0: T, arg1: T = null) => {
    if (observers.has(event))
      observers.get(event).forEach(callback => callback(arg0, arg1));
  }

  // Helper to check if the set of selected annotations has changed
  const hasSelectionChanged = (updated: T[] | null) => {
    if (!updated && !initialSelection) // both null
      return false;

    if (!updated || !initialSelection) // one of them is null
      return true;

    const initialIds = new Set(initialSelection.map(a => a.id));
    return !updated.every(a => initialIds.has(a.id));
  }

  selectionState.subscribe(selected => {
    // Don't do anything if the set of selected annotations hasn't changed
    if (!hasSelectionChanged(selected))
      return;

    if (initialSelection === null && selected) {
      // A new selection was made - store as initial state
      initialSelection = selected.map(t => ({...t}));
    } else if (initialSelection && selected === null) {
      // Deselect!
      initialSelection.forEach(initial => {
        const updatedState = store.getAnnotation(initial.id);        

        if (updatedState && !equal(updatedState, initial))
          emit('updateAnnotation', updatedState, initial);
      });

      initialSelection = null;
    } else {
      // Changed selection
      const initialIds = new Set(initialSelection.map(a => a.id));
      const selectedIds = new Set(selected.map(a => a.id));

      // Fire update events for deselected annotations that have changed
      const deselected = initialSelection.filter(a => !selectedIds.has(a.id));
      deselected.forEach(initial => {
        const updatedState = store.getAnnotation(initial.id);

        if (updatedState && !equal(updatedState, initial))
          emit('updateAnnotation', updatedState, initial);
      });

      initialSelection = [
        // Remove annotations that were deselected
        ...initialSelection.filter(a => selectedIds.has(a.id)),
        // Add annotations that were selected
        ...selected.filter(a => !initialIds.has(a.id))
      ];
    }
  });

  store.observe(event => {
    const { created, deleted } = event.changes;
    created.forEach(a => emit('createAnnotation', a));
    deleted.forEach(a => emit('deleteAnnotation', a));
  }, { origin: Origin.LOCAL });

  return {
    on,
    off
  }

}