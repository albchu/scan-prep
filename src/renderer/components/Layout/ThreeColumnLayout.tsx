import React, { useRef } from 'react';
import { useColumnResize } from './hooks/useColumnResize';
import { ResizeHandle } from './ResizeHandle';
import { Column } from './Column';
import { 
  ThreeColumnLayoutProps, 
  DEFAULT_MIN_WIDTHS, 
  DEFAULT_INITIAL_WIDTHS,
  COLUMN_TITLES,
  COLUMN_ANIMATIONS
} from './types';

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftColumn,
  middleColumn,
  rightColumn,
  className = '',
  minLeftWidth = DEFAULT_MIN_WIDTHS.left,
  minMiddleWidth = DEFAULT_MIN_WIDTHS.middle,
  minRightWidth = DEFAULT_MIN_WIDTHS.right,
  initialLeftWidth = DEFAULT_INITIAL_WIDTHS.left,
  initialMiddleWidth = DEFAULT_INITIAL_WIDTHS.middle,
  initialRightWidth = DEFAULT_INITIAL_WIDTHS.right,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { widths, isDragging, startResize } = useColumnResize(
    {
      left: initialLeftWidth,
      middle: initialMiddleWidth,
      right: initialRightWidth,
    },
    {
      left: minLeftWidth,
      middle: minMiddleWidth,
      right: minRightWidth,
    },
    containerRef
  );

  return (
    <div 
      ref={containerRef}
      className={`flex h-full relative ${className}`}
      style={{ overflow: 'hidden' }}
    >
      <Column
        title={COLUMN_TITLES.left}
        width={widths.left}
        minWidth={minLeftWidth}
        animation={COLUMN_ANIMATIONS.left}
      >
        {leftColumn}
      </Column>

      <ResizeHandle
        isActive={isDragging.left}
        onMouseDown={(e) => startResize(e, 'left')}
      />

      <Column
        title={COLUMN_TITLES.middle}
        width={widths.middle}
        minWidth={minMiddleWidth}
        animation={COLUMN_ANIMATIONS.middle}
      >
        {middleColumn}
      </Column>

      <ResizeHandle
        isActive={isDragging.right}
        onMouseDown={(e) => startResize(e, 'right')}
      />

      <Column
        title={COLUMN_TITLES.right}
        width={widths.right}
        minWidth={minRightWidth}
        animation={COLUMN_ANIMATIONS.right}
      >
        {rightColumn}
      </Column>
    </div>
  );
}; 