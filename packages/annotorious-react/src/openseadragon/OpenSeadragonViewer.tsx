import { forwardRef, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import OpenSeadragon from 'openseadragon';
import { OpenSeadragonAnnotatorContext } from './OpenSeadragonAnnotator';

export interface OpenSeadragonViewerProps {

  className?: string;

  options: OpenSeadragon.Options;

}

export const OpenSeadragonViewer = forwardRef((props: OpenSeadragonViewerProps, ref) => {

  const { className, options } = props;

  const element = useRef<HTMLDivElement>(null);

  const { viewer, setViewer } = useContext(OpenSeadragonAnnotatorContext);

  useEffect(() => {
    if (element.current) {
      const v = OpenSeadragon({...options, element: element.current });
      setViewer(v);

      return () => {
        v.destroy();
      }
    }
  }, []);

  useImperativeHandle(ref, () => viewer);

  return (
    <div className={className} ref={element} />
  );

});