import { createContext, useContext } from 'react';
import { Annotation, AnnotationLayer } from '@annotorious/core';

// @ts-ignore
export const AnnotationLayerContext = createContext<AnnotationLayer<Annotation>>(null);

export const useAnnotationLayer = () => useContext(AnnotationLayerContext);
