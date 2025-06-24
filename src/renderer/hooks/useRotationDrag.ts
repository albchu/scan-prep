import { useState, useCallback, useEffect, useRef } from 'react';
import { ViewportFrame } from '@shared/types';
import { 
  calculateAngleBetweenPoints, 
  normalizeAngle, 
  getBoundingBoxCenter,
  getMousePositionRelativeToElement,
  ScaleFactors
} from '../utils';

interface DragState {
  frameId: string;
  startAngle: number;
  startRotation: number;
  containerElement: HTMLElement;
}

interface UseRotationDragProps {
  viewportFrames: ViewportFrame[];
  scaleFactors: ScaleFactors;
  onRotationChange: (frameId: string, newRotation: number) => void;
}

export function useRotationDrag({
  viewportFrames,
  scaleFactors,
  onRotationChange,
}: UseRotationDragProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  
  // Keep the ref in sync with state
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  /**
   * Handle global mouse events
   */
  useEffect(() => {
    // Define event handlers
    function handleGlobalMouseMove(event: MouseEvent) {
      const currentDragState = dragStateRef.current;
      if (!currentDragState) return;
      
      const viewportFrame = viewportFrames.find(f => f.id === currentDragState.frameId);
      if (!viewportFrame) return;
      
      const mousePos = getMousePositionRelativeToElement(
        event, 
        currentDragState.containerElement
      );
      const center = getBoundingBoxCenter(viewportFrame.boundingBox, scaleFactors);
      const currentAngle = calculateAngleBetweenPoints(center.x, center.y, mousePos.x, mousePos.y);
      
      // Calculate rotation delta and apply to original rotation
      const angleDelta = currentAngle - currentDragState.startAngle;
      const newRotation = normalizeAngle(currentDragState.startRotation + angleDelta);
      
      onRotationChange(viewportFrame.id, newRotation);
    }
    
    function handleGlobalMouseUp() {
      setDragState(null);
    }
    
    // Add document-level event listeners
    if (dragStateRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    // Cleanup function to remove listeners
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [viewportFrames, scaleFactors, onRotationChange]); // Note we don't need dragState here as we use the ref

  /**
   * Handle rotation drag start
   */
  const handleRotationStart = useCallback((
    event: React.MouseEvent,
    viewportFrame: ViewportFrame,
    containerElement: HTMLElement | null
  ) => {
    event.preventDefault();
    
    if (!containerElement) return;
    
    // Get mouse position and center of bounding box
    const mousePos = getMousePositionRelativeToElement(event, containerElement);
    const center = getBoundingBoxCenter(viewportFrame.boundingBox, scaleFactors);
    
    // Calculate the start angle between mouse and center
    const startAngle = calculateAngleBetweenPoints(center.x, center.y, mousePos.x, mousePos.y);
    
    // Store the initial state for dragging
    setDragState({
      frameId: viewportFrame.id,
      startAngle,
      startRotation: viewportFrame.rotation,
      containerElement,
    });
  }, [scaleFactors]);

  /**
   * These functions are kept for API compatibility but functionality moved to document-level listeners
   */
  const handleRotationDrag = useCallback((_event: React.MouseEvent, _element: HTMLElement | null) => {
    // Local drag handling is no longer needed since we use document-level mousemove
  }, []);

  const handleRotationEnd = useCallback(() => {
    // This is handled by document-level mouseup event listener
    setDragState(null);
  }, []);

  return {
    dragState,
    handleRotationStart,
    handleRotationDrag,
    handleRotationEnd,
  };
} 