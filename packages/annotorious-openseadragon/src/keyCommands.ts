import type { ImageAnnotationStore } from '@annotorious/annotorious';

export const initKeyCommands = (container: HTMLElement, store: ImageAnnotationStore) => {

  const { selection } = store;

  const onDeleteSelection = () => {
    if (selection.current) {
      store.bulkDeleteAnnotation(selection.current);
    }
  }

  container.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Delete') {
      onDeleteSelection();
    }
  });

}