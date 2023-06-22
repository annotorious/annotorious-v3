import { createContext, forwardRef, ReactNode} from 'react';
import { useContext, useEffect, useImperativeHandle, useState } from 'react';
import { ImageAnnotation } from '@annotorious/annotorious';
import { Annotation, Annotator, Store, StoreChangeEvent } from '@annotorious/core';

interface Selection<T extends Annotation = Annotation> {

  selected: T[];

  pointerEvent?: PointerEvent;

}

export interface AnnotoriousContextState {

  anno: Annotator;

  setAnno(anno: Annotator): void;

  annotations: Annotation[];

  selection: Selection;

}

export const AnnotoriousContext = createContext<AnnotoriousContextState>({ 

  anno: undefined, 

  setAnno: undefined, 

  annotations: [], 

  selection: { selected: [] }

});

export const Annotorious = forwardRef((props: { children: ReactNode }, ref) => {

  const [anno, setAnno] = useState<Annotator>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const [selection, setSelection] = useState<Selection>({ selected: [] });

  useImperativeHandle(ref, () => anno);

  useEffect(() => {
    if (anno) {
      // Keeps annotations in sync with a React state,
      // so clients can render components the usual React way.
      const onStoreChange = (event: StoreChangeEvent<ImageAnnotation>) =>
        setAnnotations(event.state);

      anno.store.observe(onStoreChange);

      // Keep selection in sync with a react state, and resolve them
      // from IDs to annotations automatically, for convenience
      let selectionStoreObserver: (event: StoreChangeEvent<ImageAnnotation>) => void;

      const unsubscribeSelection = anno.selection.subscribe(({ selected, pointerEvent }) => {
        if (selectionStoreObserver) 
          anno.store.unobserve(selectionStoreObserver);

        const annotations = (selected || []).map(id => anno.store.getAnnotation(id));
        setSelection({ selected: annotations, pointerEvent });

        selectionStoreObserver = event => {
          const { updated } = event.changes;

          setSelection(({ selected, pointerEvent }) => ({
            selected: selected.map(a => {
              const next = updated.find(u => u.oldValue.id === a.id);
              return next ? next.newValue : a;
            }),
            pointerEvent
          }));
        }

        anno.store.observe(selectionStoreObserver, { annotations: selected });
      });

      return () => {
        anno.store.unobserve(onStoreChange);
        unsubscribeSelection();
      }
    }
  }, [anno]);

  return (
    <AnnotoriousContext.Provider value={{ anno, setAnno, annotations, selection }}>
       {props.children}
    </AnnotoriousContext.Provider>
  )

});

export const useAnnotator = <T extends Annotation>() => {
  const { anno } = useContext(AnnotoriousContext);
  return anno as Annotator<T>;
}

export const useAnnotationStore = <T extends Store<Annotation>>() => {
  const { anno } = useContext(AnnotoriousContext);
  return anno?.store as T | undefined;
}

export const useAnnotations = <T extends Annotation>() => {
  const { annotations } = useContext(AnnotoriousContext);
  return annotations as T[];
}

export const useSelection = <T extends Annotation>() => {
  const { selection } = useContext(AnnotoriousContext);
  return selection as Selection<T>;
}

export const useAnnotatorUser = () => {
  const { anno } = useContext(AnnotoriousContext);
  return anno.getUser();
}