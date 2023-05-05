import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { Annotorious, OSDAnnotator } from '@annotorious/openseadragon';
import { AnnotoriousOptions } from '@annotorious/annotorious';
import { AnnotoriousContext } from '../Annotorious';

export const OpenSeadragonAnnotatorContext = createContext<{ 
  viewer: OpenSeadragon.Viewer,
  setViewer(viewer: OpenSeadragon.Viewer): void
}>({ viewer: null, setViewer: null });

export type OpenSeadragonAnnotatorProps = AnnotoriousOptions & {

  children?: ReactNode;

  keepEnabled?: boolean;

  tool?: string | null;

}

export const OpenSeadragonAnnotator = (props: OpenSeadragonAnnotatorProps) => {

  const { children, keepEnabled, tool, ...opts } = props;

  const [viewer, setViewer] = useState<OpenSeadragon.Viewer>();

  const { anno, setAnno } = useContext(AnnotoriousContext);

  useEffect(() => {
    if (viewer) {
      const anno = Annotorious(viewer, opts);
      setAnno(anno);
    }
  }, [viewer]);

  useEffect(() => {
    if (!anno)
      return;

    if (props.tool)
      (anno as OSDAnnotator).startDrawing(props.tool, props.keepEnabled);
    else
      (anno as OSDAnnotator).stopDrawing();
  }, [props.tool, props.keepEnabled]);

  return (
    <OpenSeadragonAnnotatorContext.Provider value={{ viewer, setViewer }}>
      {props.children}
    </OpenSeadragonAnnotatorContext.Provider>
  )

}

export const useViewer = () => {
  const { viewer } = useContext(OpenSeadragonAnnotatorContext);
  return viewer;
}