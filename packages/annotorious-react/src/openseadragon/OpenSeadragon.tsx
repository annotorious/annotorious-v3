import OSD from 'openseadragon';
import React, {
  ReactElement, 
  createContext, 
  forwardRef,
  useContext,
  useEffect, 
  useImperativeHandle,
  useRef, 
  useState 
} from 'react';

export interface OpenSeadragonProps {

  className?: string;

  options: OSD.Options;

  children: ReactElement | never[];

}

// @ts-ignore
export const ViewerContext = createContext<OSD.Viewer>(null);

/** A helper to use OpenSeadragon as a React JSX tag **/
export const OpenSeadragon = forwardRef((props: OpenSeadragonProps, ref) => {

  const { children, className, options } = props;

  const element = useRef<HTMLDivElement | null>(null);

  const [viewer, setViewer] = useState<OSD.Viewer>();

  useEffect(() => {
    if (element.current) {
      const v = OSD({...options, element: element.current });
      setViewer(v);

      return () => v.destroy();
    }
  }, []);

  useImperativeHandle(ref, () => viewer);
  
  return (
    <div className={className} ref={element}>
      {viewer && (
        <ViewerContext.Provider value={viewer} >
          {children}
        </ViewerContext.Provider>
      )}
    </div>
  );

});

export const useViewer = () => useContext(ViewerContext);