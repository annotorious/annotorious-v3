import type { ImageAnnotationStore } from '@annotorious/annotorious';

export const initKeyCommands = (container: HTMLElement, store: ImageAnnotationStore) => {

  const { selection } = store;

  const onDeleteSelection = () => {
    if (selection.selected) {
      store.bulkDeleteAnnotation(selection.selected);
    }
  }

  container.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Delete') {
      onDeleteSelection();
    }
  });

}