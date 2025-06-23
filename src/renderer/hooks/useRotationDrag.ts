import { useState, useCallback } from 'react';
import { DetectedSubImage } from '@shared/types';
import { 
  calculateAngleBetweenPoints, 
  normalizeAngle, 
  getBoundingBoxCenter,
  getMousePositionRelativeToSVG,
  ScaleFactors
} from '../utils';

interface DragState {
  detectionId: string;
  startAngle: number;
  startRotation: number;
}

interface UseRotationDragProps {
  detectedImages: DetectedSubImage[];
  scaleFactors: ScaleFactors;
  onRotationChange: (detectionId: string, newRotation: number) => void;
}

export function useRotationDrag({
  detectedImages,
  scaleFactors,
  onRotationChange,
}: UseRotationDragProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  /**
   * Handle rotation drag start
   */
  const handleRotationStart = useCallback((
    event: React.MouseEvent,
    detection: DetectedSubImage,
    svgElement: SVGSVGElement | null
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    const mousePos = getMousePositionRelativeToSVG(event, svgElement);
    const center = getBoundingBoxCenter(detection.boundingBox, scaleFactors);
    const startAngle = calculateAngleBetweenPoints(center.x, center.y, mousePos.x, mousePos.y);
    
    setDragState({
      detectionId: detection.id,
      startAngle,
      startRotation: detection.userRotation,
    });
  }, [scaleFactors]);

  /**
   * Handle rotation drag
   */
  const handleRotationDrag = useCallback((
    event: React.MouseEvent,
    svgElement: SVGSVGElement | null
  ) => {
    if (!dragState) return;
    
    const detection = detectedImages.find(d => d.id === dragState.detectionId);
    if (!detection) return;
    
    const mousePos = getMousePositionRelativeToSVG(event, svgElement);
    const center = getBoundingBoxCenter(detection.boundingBox, scaleFactors);
    const currentAngle = calculateAngleBetweenPoints(center.x, center.y, mousePos.x, mousePos.y);
    
    // Calculate rotation delta and apply to original rotation
    const angleDelta = currentAngle - dragState.startAngle;
    const newRotation = normalizeAngle(dragState.startRotation + angleDelta);
    
    onRotationChange(detection.id, newRotation);
  }, [dragState, detectedImages, scaleFactors, onRotationChange]);

  /**
   * Handle rotation drag end
   */
  const handleRotationEnd = useCallback(() => {
    setDragState(null);
  }, []);

  return {
    dragState,
    handleRotationStart,
    handleRotationDrag,
    handleRotationEnd,
  };
} 