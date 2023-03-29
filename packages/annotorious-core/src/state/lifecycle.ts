import equal from 'deep-equal';
import type { Annotation } from '../model';
import { createSelectionState } from './selection';
import type { Store } from './Store';

interface LifecycleEvents {

  createAnnotation: (annotation: Annotation) => void;

  createSelection: (annotation: Annotation) => void;

  deleteAnnotation: (annotation: Annotation) => void;

  updateAnnotation: (annotation: Annotation, previous: Annotation) => void;

}

export const createLifecyleEmitter = <T extends Annotation>(store: Store<T>, ) => {

  const selectionState = createSelectionState(store);

  const observers = new Map<string, LifecycleEvents[keyof LifecycleEvents][]>();

  // The currently selected annotations, in the state 
  // when they were selected 
  let initialSelection: T[] = null;

  const on = <E extends keyof LifecycleEvents>(event: E, callback: LifecycleEvents[E]) => {
    if (observers.has(event)) {
      observers.get(event).push(callback);
    } else {
      observers.set(event, [callback]);
    }
  }

  const off = <E extends keyof LifecycleEvents>(event: E, callback: LifecycleEvents[E]) => {
    const callbacks = observers.get(event);
    if (callbacks)
      callbacks.splice(callbacks.indexOf(callback), 1);
  }

  const emit = (event: keyof LifecycleEvents, arg0: Annotation, arg1: Annotation = null) => {
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

      selected.forEach(annotation => {
        if (annotation.bodies.length === 0)
          emit('createSelection', annotation);
      });
    } else if (initialSelection && selected === null) {
      // Deselect!
      initialSelection.forEach(initialAnnotation => {
        const currentState = store.getAnnotation(initialAnnotation.id);
        
        if (!currentState) {
          emit('deleteAnnotation', initialAnnotation);
        } else if (initialAnnotation.bodies.length === 0 && currentState.bodies.length > 0) {
          emit('createAnnotation', currentState);
        } else if (!equal(currentState, initialAnnotation)) {
          emit('updateAnnotation', currentState, initialAnnotation);
        }
      });
    }
  });

  return {
    on,
    off
  }

}