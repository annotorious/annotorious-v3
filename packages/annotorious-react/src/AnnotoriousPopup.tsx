import { forwardRef, ReactNode } from 'react';
import { ImageAnnotation } from '@annotorious/annotorious';
import { useDraggable } from '@neodrag/react';

export interface AnnotoriousPopupProps {

  selection: ImageAnnotation[];

}

export interface DraggableProps {

  children: ReactNode;

  className?: string;

  onDragStart?(): void;

  onDragEnd?(): void;

}

export const Draggable = forwardRef((props: DraggableProps, ref: React.MutableRefObject<HTMLDivElement>)  => {

  const { children, className, onDragStart, onDragEnd } = props;

  useDraggable(ref, { onDragStart, onDragEnd, cancel: 'button, .no-drag' });

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ position: 'absolute' }}>
      {children}
    </div>
  )

});