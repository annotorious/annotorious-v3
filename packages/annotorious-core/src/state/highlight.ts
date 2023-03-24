import { writable } from 'svelte/store';
import type { Annotation } from '../model';
import type { Store } from './Store';

export const createHighlightState = <T extends Annotation>(store: Store<T>) => {

  const { subscribe, set } = writable<string[]>(null);

  let currentHighlight: string[] = null;

  subscribe(updated => currentHighlight = updated);

  const isHighlighted = (annotationOrId: T | string) => {
    if (!currentHighlight)
      return false;

    const id = typeof annotationOrId === 'string' ? annotationOrId : annotationOrId.id;
    return currentHighlight.some(i => i === id);
  }

  const removeFromHighlight = (annotations: T[]) => {
    if (!currentHighlight)
      return;

    const ids = new Set(annotations.map(a => a.id));

    // Checks which of the given annotations are actually in the selection
    const toRemove = currentHighlight.filter(id => ids.has(id))
    if (toRemove.length > 0)
      set(currentHighlight.filter(id => !ids.has(id)))
  }

  // Track store delete and update events
  store.observe(({ changes }) =>
    removeFromHighlight(changes.deleted));

  return { isHighlighted, set, subscribe };

}