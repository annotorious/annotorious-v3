import { useContext, useEffect, useState } from 'react';
import { ImageAnnotation, ImageAnnotationStore } from '@annotorious/annotorious';
import { Annotator, StoreChangeEvent } from '@annotorious/core';
import { createContext, ReactElement } from 'react';

export interface AnnotoriousContextState {

  anno: Annotator<ImageAnnotation>;

  setAnno(anno: Annotator<ImageAnnotation>): void;

  annotations: ImageAnnotation[];

  selection: ImageAnnotation[];

}

export const AnnotoriousContext = createContext<AnnotoriousContextState>({ 

  anno: undefined, 

  setAnno: undefined, 

  annotations: [], 

  selection: [] 

});

export const Annotorious = (props: { children: ReactElement }) => {

  const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);

  const [anno, setAnno] = useState<Annotator<ImageAnnotation>>(null);

  const [selection, setSelection] = useState<ImageAnnotation[]>([]);

  useEffect(() => {
    if (anno) {
      const store = anno.store as ImageAnnotationStore;

      // Keeps annotations in sync with a React state,
      // so clients can render components the usual React way.
      const onStoreChange = (event: StoreChangeEvent<ImageAnnotation>) =>
        setAnnotations(event.state);

      // Keep selection in sync with a react state, and resolve them
      // from IDs to annotations automatically, for convenience
      let selectionStoreObserver: (event: StoreChangeEvent<ImageAnnotation>) => void;

      const unsubscribeSelection = store.selection.subscribe((selection: string[]) => {
        if (selectionStoreObserver) 
          store.unobserve(selectionStoreObserver);

        const annotations = (selection || []).map(id => store.getAnnotation(id));
        setSelection(annotations);

        selectionStoreObserver = event => {
          const { updated } = event.changes;

          setSelection(selection => selection.map(a => {
            const next = updated.find(u => u.oldValue.id === a.id);
            return next ? next.newValue : a;
          }));
        }

        store.observe(selectionStoreObserver, { annotations: selection });
      });

      return () => {
        store.unobserve(onStoreChange);
        unsubscribeSelection();
      }
    }
  }, [anno]);

  return (
    <AnnotoriousContext.Provider value={{ anno, setAnno, annotations, selection }}>
       {props.children}
    </AnnotoriousContext.Provider>
  )

}

export const useAnnotationLayerState = <T extends Annotator<ImageAnnotation>>(): [
  T, (anno: Annotator<ImageAnnotation>) => void
] => { 
  const { anno, setAnno } = useContext(AnnotoriousContext);
  return [anno as T, setAnno];
}

export const useAnnotationLayer = <T extends Annotator<ImageAnnotation>>() => {
  const { anno } = useContext(AnnotoriousContext);
  return anno as T;
}

export const useAnnotationStore = () => {
  const { anno } = useContext(AnnotoriousContext);
  return anno.store;
}

export const useAnnotations = () => {
  const { annotations } = useContext(AnnotoriousContext);
  return annotations;
}

export const useSelection = () => {
  const { selection } = useContext(AnnotoriousContext);
  return selection;
}

export const useUser = () => {
  const { anno } = useContext(AnnotoriousContext);
  return anno.getUser();
}