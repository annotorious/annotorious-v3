import { forwardRef, ReactNode } from 'react';
import { useDraggable } from '@neodrag/react';

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