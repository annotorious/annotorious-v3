import { ReactNode, useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { Draggable } from './Draggable';
import { useViewer } from '../OSDViewer';
import { useSelection } from '../../Annotorious';
import { OSDPopupContentProps } from './OSDPopupContentProps';

export interface OSDPopupContainerProps {

  content(props: OSDPopupContentProps): ReactNode;

}

export const OSDPopup = (props: OSDPopupContainerProps) => {

  const el = useRef<HTMLDivElement>(null);

  const viewer = useViewer();

  const selection = useSelection();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [dragged, setDragged] = useState(false);

  const onDragStart = () => setDragged(true);

  const updatePosition = () => {
    // Note: this popup only supports a single selection
    const annotation = selection[0];

    const { minX, minY, maxX, maxY } = annotation.target.selector.geometry.bounds;

    const PADDING = 14;

    const topLeft = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(minX, minY));
    const bottomRight = viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(maxX, maxY));

    el.current.style.left = `${bottomRight.x + PADDING}px`;
    el.current.style.top = `${topLeft.y}px`;
  }

  const equal = (a: string[], b: string[]) => 
    a.every(str => b.includes(str)) && b.every(str => a.includes(str));

  useEffect(() => {
    // Reset drag flag if selected IDs have changed
    const nextIds = selection.map(a => a.id);

    if (!equal(selectedIds, nextIds)) {
      setDragged(false);
      setSelectedIds(nextIds);
    }
  }, [selection]);

  useEffect(() => {
    if (!el.current) return;

    if (!dragged) updatePosition();

    const onUpdateViewport = () => {
      if (!dragged) updatePosition();
    }

    viewer.addHandler('update-viewport', onUpdateViewport);

    return () => {
      viewer.removeHandler('update-viewport', onUpdateViewport);
    }
  }, [selection, dragged]);
  
  return selection.length > 0 ? (
    <Draggable ref={el} key={selection.map(a => a.id).join('-')} className="a9s-popup a9s-osd-popup" onDragStart={onDragStart}>
      {props.content({ viewer, selection})}
    </Draggable>
  ) : null;

}