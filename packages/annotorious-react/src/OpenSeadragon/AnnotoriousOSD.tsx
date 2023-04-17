import React, { ReactElement, useEffect, useMemo } from 'react';
import { Annotation, AnnotationLayer } from '@annotorious/core';
import type { AnnotoriousOptions } from '@annotorious/annotorious';
import { Annotorious } from '@annotorious/openseadragon';
import { useViewer } from '../OpenSeadragon';
import { AnnotationLayerContext } from '../AnnotationLayerContext';

export interface AnnotoriousOSDProps {

  children?: ReactElement | never[];

  keepEnabled?: boolean;

  opts?: AnnotoriousOptions;

  tool?: string | null;

}

export const AnnotoriousOSD = ( props: AnnotoriousOSDProps) => {

  const viewer = useViewer();

  const opts = props.opts || {};

  const anno = useMemo(() => Annotorious(viewer, opts), []);

  useEffect(() => {
    if (props.tool)
      anno.startDrawing(props.tool, props.keepEnabled);
    else if (props.tool)
      anno.stopDrawing();
  }, [props.tool, props.keepEnabled]);

  return (
    <AnnotationLayerContext.Provider value={anno as unknown as AnnotationLayer<Annotation>}>
      {props.children}
    </AnnotationLayerContext.Provider>
  );

}