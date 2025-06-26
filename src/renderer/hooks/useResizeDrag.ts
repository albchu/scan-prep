import { useState, useCallback, useEffect, useRef } from 'react';
import { ViewportFrame, BoundingBox, FrameEdge } from '@shared/types';
import { 
  calculateResizedBoundingBox,
  validateBoundingBox,
  getMousePositionRelativeToElement,
  getResizeEdgeMapping,
  ScaleFactors,
  Point
} from '../utils/geometryUtils';

interface ResizeDragState {
  frameId: string;
  initialEdge: FrameEdge; // The handle that was clicked
  currentEdge: FrameEdge; // The edge currently being resized (may change based on drag direction)
  startBoundingBox: BoundingBox;
  startMousePosition: Point;
  containerElement: HTMLElement;
  edgeMappingActive: boolean; // Whether dynamic edge mapping is active
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
      
      // Determine which edge to resize based on drag direction for rotated frames
      let resizeEdge = currentDragState.currentEdge;
      
      // For rotated frames, determine the appropriate edge based on drag direction
      // Only activate edge mapping after a minimum drag distance to avoid jitter
      const dragDistance = Math.sqrt(mouseDelta.x * mouseDelta.x + mouseDelta.y * mouseDelta.y);
      const minDragDistance = 5; // pixels
      
      if (viewportFrame.rotation !== 0 && dragDistance > minDragDistance) {
        // Normalize drag direction
        const dragDirection = {
          x: mouseDelta.x / dragDistance,
          y: mouseDelta.y / dragDistance
        };
        
        // Get the edge mapping based on frame rotation and drag direction
        const mappedEdge = getResizeEdgeMapping(viewportFrame.rotation, dragDirection);
        
        // Update the current edge if it has changed
        if (mappedEdge !== currentDragState.currentEdge) {
          resizeEdge = mappedEdge;
          
          // Update the drag state to reflect the new edge
          const updatedDragState = {
            ...currentDragState,
            currentEdge: mappedEdge,
            edgeMappingActive: true
          };
          setDragState(updatedDragState);
          dragStateRef.current = updatedDragState;
        }
      }
      
      // Calculate new bounding box based on the determined edge
      const newBoundingBox = calculateResizedBoundingBox(
        currentDragState.startBoundingBox,
        resizeEdge,
        mouseDelta,
        scaleFactors,
        viewportFrame.rotation, // Pass the frame's rotation
        imageWidth,
        imageHeight,
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
    edge: FrameEdge,
    containerElement: HTMLElement | null
  ) => {
    event.preventDefault();
    
    if (!containerElement) return;
    
    // Get mouse position relative to container
    const mousePos = getMousePositionRelativeToElement(event, containerElement);
    
    // Store the initial state for dragging
    setDragState({
      frameId: viewportFrame.id,
      initialEdge: edge, // Store the handle that was clicked
      currentEdge: edge, // Initially, current edge is the same as initial edge
      startBoundingBox: { ...viewportFrame.boundingBox },
      startMousePosition: mousePos,
      containerElement,
      edgeMappingActive: false, // Edge mapping starts inactive
    });
  }, []);

  return {
    handleResizeStart,
    isDragging: dragState !== null,
    currentEdge: dragState?.currentEdge || null, // Expose current edge for debugging/UI feedback
    edgeMappingActive: dragState?.edgeMappingActive || false, // Expose edge mapping state
  };
} 