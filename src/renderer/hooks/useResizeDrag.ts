import { useState, useCallback, useEffect, useRef } from 'react';
import { ViewportFrame, BoundingBox } from '@shared/types';
import { 
  calculateResizedBoundingBox,
  validateBoundingBox,
  getMousePositionRelativeToElement,
  ScaleFactors,
  Point
} from '../utils/geometryUtils';

interface ResizeDragState {
  frameId: string;
  edge: 'top' | 'right' | 'bottom' | 'left';
  startBoundingBox: BoundingBox;
  startMousePosition: Point;
  containerElement: HTMLElement;
}

interface UseResizeDragProps {
  viewportFrames: ViewportFrame[];
  scaleFactors: ScaleFactors;
  onResizeChange: (frameId: string, newBoundingBox: BoundingBox) => void;
  imageWidth?: number;
  imageHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export function useResizeDrag({
  viewportFrames,
  scaleFactors,
  onResizeChange,
  imageWidth = 1000,
  imageHeight = 1000,
  minWidth = 20,
  minHeight = 20,
}: UseResizeDragProps) {
  const [dragState, setDragState] = useState<ResizeDragState | null>(null);
  const dragStateRef = useRef<ResizeDragState | null>(null);
  
  // Keep the ref in sync with state
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  /**
   * Handle global mouse events
   */
  useEffect(() => {
    function handleGlobalMouseMove(event: MouseEvent) {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) return;
      
      const viewportFrame = viewportFrames.find(f => f.id === currentDragState.frameId);
      if (!viewportFrame) return;
      
      const mousePos = getMousePositionRelativeToElement(
        event, 
        currentDragState.containerElement
      );
      
      // Calculate mouse delta from start position
      const mouseDelta: Point = {
        x: mousePos.x - currentDragState.startMousePosition.x,
        y: mousePos.y - currentDragState.startMousePosition.y,
      };
      
      // Calculate new bounding box based on edge and mouse delta
      const newBoundingBox = calculateResizedBoundingBox(
        currentDragState.startBoundingBox,
        currentDragState.edge,
        mouseDelta,
        scaleFactors,
        viewportFrame.rotation, // Pass the frame's rotation
        minWidth,
        minHeight
      );
      
      // Validate the new bounding box against image constraints
      const validatedBoundingBox = validateBoundingBox(
        newBoundingBox,
        imageWidth,
        imageHeight,
        minWidth,
        minHeight
      );
      
      onResizeChange(viewportFrame.id, validatedBoundingBox);
    }
    
    function handleGlobalMouseUp() {
      setDragState(null);
    }
    
    // Add document-level event listeners when dragging
    if (dragStateRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    // Cleanup function to remove listeners
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [viewportFrames, scaleFactors, onResizeChange, imageWidth, imageHeight, minWidth, minHeight]);

  /**
   * Handle resize drag start
   */
  const handleResizeStart = useCallback((
    event: React.MouseEvent,
    viewportFrame: ViewportFrame,
    edge: 'top' | 'right' | 'bottom' | 'left',
    containerElement: HTMLElement | null
  ) => {
    event.preventDefault();
    
    if (!containerElement) return;
    
    // Get mouse position relative to container
    const mousePos = getMousePositionRelativeToElement(event, containerElement);
    
    // Store the initial state for dragging
    setDragState({
      frameId: viewportFrame.id,
      edge,
      startBoundingBox: { ...viewportFrame.boundingBox },
      startMousePosition: mousePos,
      containerElement,
    });
  }, []);

  return {
    handleResizeStart,
    isDragging: dragState !== null,
  };
} 