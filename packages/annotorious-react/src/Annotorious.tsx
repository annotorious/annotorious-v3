import { useContext, useEffect, useState } from 'react';
import { ImageAnnotation } from '@annotorious/annotorious';
import { AnnotationLayer, StoreChangeEvent } from '@annotorious/core';
import { createContext, ReactElement } from 'react';

export interface AnnotoriousContextState {

  anno: AnnotationLayer<ImageAnnotation>

  setAnno(anno: AnnotationLayer<ImageAnnotation>): void;

  annotations: ImageAnnotation[];

}

const AnnotoriousContext = createContext<AnnotoriousContextState>(null);

export const Annotorious = (props: { children: ReactElement }) => {

  const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);

  const [anno, setAnno] = useState<AnnotationLayer<ImageAnnotation>>(null);

  useEffect(() => {
    // This convenience function keeps annotations in sync with a React state,
    // so clients can render components the usual React way.
    const onStoreChange = (event: StoreChangeEvent<ImageAnnotation>) => {
      const { created, deleted, updated } = event.changes;

      const deletedIds = new Set(deleted.map(a => a.id));
      const updateIds = new Set(updated.map(a => a.oldValue.id));

      const next = [ 
        ...annotations
          // Remove deleted
          .filter(annotation => !deletedIds.has(annotation.id)) 
          // Replace updated
          .map(annotation => updateIds.has(annotation.id) ? 
            updated.find(a => a.oldValue.id === annotation.id).newValue : annotation),
        // Append created
        ...created
      ];

      setAnnotations(next);
    };

    anno.store.observe(onStoreChange);

    return () => {
      anno.store.unobserve(onStoreChange);
    }
  }, [anno]);

  return (
    <AnnotoriousContext.Provider value={{ anno, setAnno, annotations }}>
       {props.children}
    </AnnotoriousContext.Provider>
  )

}

export const useAnnotationLayerState = (): [
  AnnotationLayer<ImageAnnotation>,
  (anno: AnnotationLayer<ImageAnnotation>) => void
] => { 
  const { anno, setAnno } = useContext(AnnotoriousContext);
  return [anno, setAnno];
}

export const useAnnotationLayer = () => {
  const { anno } = useContext(AnnotoriousContext);
  return anno;
}

export const useAnnotationStore = () => {
  const { anno } = useContext(AnnotoriousContext);
  return anno.store;
}

export const useAnnotations = () => {
  const { annotations } = useContext(AnnotoriousContext);
  return annotations;
}