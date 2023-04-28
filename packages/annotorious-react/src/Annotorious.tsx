import { useContext, useEffect, useState } from 'react';
import { ImageAnnotation } from '@annotorious/annotorious';
import { AnnotationLayer, StoreChangeEvent } from '@annotorious/core';
import { createContext, ReactElement } from 'react';

export interface AnnotoriousContextState {

  anno: AnnotationLayer<ImageAnnotation>

  setAnno(anno: AnnotationLayer<ImageAnnotation>): void;

  annotations: ImageAnnotation[];

}

export const AnnotoriousContext = createContext<AnnotoriousContextState>({ anno: undefined, setAnno: undefined, annotations: [] });

export const Annotorious = (props: { children: ReactElement }) => {

  const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);

  const [anno, setAnno] = useState<AnnotationLayer<ImageAnnotation>>(null);

  useEffect(() => {
    // This convenience function keeps annotations in sync with a React state,
    // so clients can render components the usual React way.
    const onStoreChange = (event: StoreChangeEvent<ImageAnnotation>) =>
      setAnnotations(event.state);

    if (anno) {
      anno.store.observe(onStoreChange);

      return () => {
        anno.store.unobserve(onStoreChange);
      }
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
  const ctx = useContext(AnnotoriousContext);
  return [ctx.anno, ctx.setAnno];
}

export const useAnnotationLayer = () => {
  const ctx = useContext(AnnotoriousContext);
  return ctx.anno;
}

export const useAnnotationStore = () => {
  const ctx = useContext(AnnotoriousContext);
  return ctx.anno.store;
}

export const useAnnotations = () => {
  const ctx = useContext(AnnotoriousContext);
  return ctx.annotations;
}

export const useUser = () => {
  const ctx = useContext(AnnotoriousContext);
  return ctx.anno.getUser();
}