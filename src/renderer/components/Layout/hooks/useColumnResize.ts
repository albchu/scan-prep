import { useState, useRef, useEffect, useCallback } from 'react';

interface ColumnWidths {
  left: number;
  middle: number;
  right: number;
}

interface MinWidths {
  left: number;
  middle: number;
  right: number;
}

interface DragState {
  mouseX: number;
  leftWidth: number;
  middleWidth: number;
  rightWidth: number;
}

export const useColumnResize = (
  initialWidths: ColumnWidths,
  minWidths: MinWidths,
  containerRef: React.RefObject<HTMLDivElement>
) => {
  const [leftWidth, setLeftWidth] = useState(initialWidths.left);
  const [middleWidth, setMiddleWidth] = useState(initialWidths.middle);
  const [rightWidth, setRightWidth] = useState(initialWidths.right);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
  const dragStartRef = useRef<DragState>({
    mouseX: 0,
    leftWidth: 0,
    middleWidth: 0,
    rightWidth: 0,
  });

  // Ensure widths always sum to 100%
  useEffect(() => {
    const total = leftWidth + middleWidth + rightWidth;
    if (Math.abs(total - 100) > 0.1) {
      const scale = 100 / total;
      setLeftWidth(leftWidth * scale);
      setMiddleWidth(middleWidth * scale);
      setRightWidth(rightWidth * scale);
    }
  }, []);

  const startResize = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    
    // Store initial state
    dragStartRef.current = {
      mouseX: ((e.clientX - containerLeft) / containerWidth) * 100,
      leftWidth,
      middleWidth,
      rightWidth,
    };
    
    if (side === 'left') {
      setIsDraggingLeft(true);
    } else {
      setIsDraggingRight(true);
    }
  }, [leftWidth, middleWidth, rightWidth, containerRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    const mouseX = e.clientX - containerLeft;
    const mousePercent = (mouseX / containerWidth) * 100;
    
    const deltaPercent = mousePercent - dragStartRef.current.mouseX;

    if (isDraggingLeft) {
      // Calculate new widths based on delta from initial position
      const newLeftWidth = dragStartRef.current.leftWidth + deltaPercent;
      const newMiddleWidth = dragStartRef.current.middleWidth - deltaPercent;
      
      // Check minimum widths
      const minLeftPercent = (minWidths.left / containerWidth) * 100;
      const minMiddlePercent = (minWidths.middle / containerWidth) * 100;
      
      if (newLeftWidth >= minLeftPercent && newMiddleWidth >= minMiddlePercent) {
        setLeftWidth(newLeftWidth);
        setMiddleWidth(newMiddleWidth);
      }
    } else if (isDraggingRight) {
      // Calculate new widths based on delta from initial position
      const newMiddleWidth = dragStartRef.current.middleWidth + deltaPercent;
      const newRightWidth = dragStartRef.current.rightWidth - deltaPercent;
      
      // Check minimum widths
      const minMiddlePercent = (minWidths.middle / containerWidth) * 100;
      const minRightPercent = (minWidths.right / containerWidth) * 100;
      
      if (newMiddleWidth >= minMiddlePercent && newRightWidth >= minRightPercent) {
        setMiddleWidth(newMiddleWidth);
        setRightWidth(newRightWidth);
      }
    }
  }, [isDraggingLeft, isDraggingRight, minWidths, containerRef]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  // Handle mouse events for dragging
  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return {
    widths: {
      left: leftWidth,
      middle: middleWidth,
      right: rightWidth,
    },
    isDragging: {
      left: isDraggingLeft,
      right: isDraggingRight,
    },
    startResize,
  };
}; 