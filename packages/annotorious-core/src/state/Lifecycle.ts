import equal from 'deep-equal';
import type { Annotation } from '../model';
import type { Store } from './Store';
import { Origin } from './StoreObserver';
import type { SelectionState } from './Selection';

export type Lifecycle<T extends Annotation> = ReturnType<typeof createLifecyleObserver<T>>;

export interface LifecycleEvents<T extends Annotation> {

  createAnnotation: (annotation: T) => void;

  deleteAnnotation: (annotation: T) => void;

  selectionChanged: (annotation: T[]) => void;

  updateAnnotation: (annotation: T, previous: T) => void;

}

export const createLifecyleObserver = <T extends Annotation>(selectionState: SelectionState<T>, store: Store<T> ) => {

  const observers = new Map<string, LifecycleEvents<T>[keyof LifecycleEvents<T>][]>();

  // The currently selected annotations, in the state 
  // when they were selected 
  let initialSelection: T[] = [];

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

  const emit = (event: keyof LifecycleEvents<T>, arg0: T | T[], arg1: T = null) => {
    if (observers.has(event))
      observers.get(event).forEach(callback => callback(arg0 as T & T[], arg1));
  }

  selectionState.subscribe(({ selected })=> {
    if (initialSelection.length === 0 && selected.length === 0)
      return;

    if (initialSelection.length === 0 && selected.length > 0) {
      // A new selection was made - store as initial state
      initialSelection = selected.map(id => store.getAnnotation(id));
    } else if (initialSelection.length > 0 && selected.length === 0) {
      // Deselect!
      initialSelection.forEach(initial => {
        const updatedState = store.getAnnotation(initial.id);  
        
        if (updatedState && !equal(updatedState, initial)) {
          emit('updateAnnotation', updatedState, initial);
        }
      });

      initialSelection = [];
    } else {
      // Changed selection
      const initialIds = new Set(initialSelection.map(a => a.id));
      const selectedIds = new Set(selected);

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
        ...selected.filter(id => !initialIds.has(id)).map(id => store.getAnnotation(id))
      ];
    }

    emit('selectionChanged', initialSelection);
  });

  store.observe(event => {
    // Local CREATE and DELETE events are applied immediately
    const { created, deleted } = event.changes;
    created.forEach(a => emit('createAnnotation', a));
    deleted.forEach(a => emit('deleteAnnotation', a));

    // Updates are only applied immediately if they involve body changes
    const updatesWithBody = event.changes.updated.filter(u => [
      ...(u.bodiesCreated || []),
      ...(u.bodiesDeleted || []),
      ...(u.bodiesUpdated || [])
    ].length > 0);

    updatesWithBody.forEach(({ oldValue, newValue }) => emit('updateAnnotation', newValue, oldValue));
  }, { origin: Origin.LOCAL });

  // Track remote changes - these should update the initial state
  store.observe(event => {
    if (initialSelection) {
      const selectedIds = new Set(initialSelection.map(a => a.id));

      const relevantUpdates = event.changes.updated
        .filter(({ newValue }) => selectedIds.has(newValue.id))
        .map(({ newValue }) => newValue);

      if (relevantUpdates.length > 0) {
        initialSelection = initialSelection.map(selected => {
          const updated = relevantUpdates.find(updated => updated.id === selected.id);
          return updated ? updated : selected;
        })
      }
    }
  }, { origin: Origin.REMOTE });

  return { on, off }

}