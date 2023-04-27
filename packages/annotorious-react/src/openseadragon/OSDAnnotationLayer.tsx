import { ReactElement, useEffect } from 'react';
import type { AnnotoriousOptions } from '@annotorious/annotorious';
import { Annotorious, OSDAnnotationLayer as OSDLayer } from '@annotorious/openseadragon';
import { useViewer } from './OpenSeadragon';
import { useAnnotationLayerState } from 'src/Annotorious';

export interface AnnotoriousOSDProps {

  children?: ReactElement | never[];

  keepEnabled?: boolean;

  opts?: AnnotoriousOptions;

  tool?: string | null;

}

export const OSDAnnotationLayer = (props: AnnotoriousOSDProps) => {

  const viewer = useViewer();

  const [anno, setAnno] = useAnnotationLayerState();

  const opts = props.opts || {};

  useEffect(() => {
    setAnno(Annotorious(viewer, opts));
  }, []);

  useEffect(() => {
    if (props.tool)
      (anno as OSDLayer).startDrawing(props.tool, props.keepEnabled);
    else if (props.tool)
      (anno as OSDLayer).stopDrawing();
  }, [props.tool, props.keepEnabled]);

  return (
    <>
      {props.children}
    </>
  );

}