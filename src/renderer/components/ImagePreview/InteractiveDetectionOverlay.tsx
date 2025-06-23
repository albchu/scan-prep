import React, { useRef } from 'react';
import { DetectedSubImage } from '@shared/types';
import { 
  calculateScaleFactors,
  getBoundingBoxCenter,
} from '../../utils';
import { useRotationDrag } from '../../hooks/useRotationDrag';

interface InteractiveDetectionOverlayProps {
  detectedImages: DetectedSubImage[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  onRotationChange: (detectionId: string, newRotation: number) => void;
  onBackgroundClick: (event: React.MouseEvent<Element, MouseEvent>) => void;
}

export const InteractiveDetectionOverlay: React.FC<InteractiveDetectionOverlayProps> = ({
  detectedImages,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  onRotationChange,
  onBackgroundClick,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate scale factors
  const scaleFactors = calculateScaleFactors(imageWidth, imageHeight, displayWidth, displayHeight);

  // Use rotation drag hook
  const { handleRotationStart } = useRotationDrag({
    detectedImages,
    scaleFactors,
    onRotationChange,
  });

  const onDivMouseDown = (event: React.MouseEvent, detection: DetectedSubImage) => {
    // Stop propagation here to prevent background click
    event.stopPropagation();
    handleRotationStart(event, detection, overlayRef.current);
  };

  // Handle clicks on the overlay (not on detection boxes)
  const handleOverlayClick = (event: React.MouseEvent) => {
    // Forward the click to the parent component
    onBackgroundClick(event);
  };

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair" 
      style={{ width: displayWidth, height: displayHeight }}
      onClick={handleOverlayClick}
    >
      {detectedImages.map((detection) => {
        const { x, y, width, height } = detection.boundingBox;
        const center = getBoundingBoxCenter(detection.boundingBox, scaleFactors);
        
        // Scale the position and size to match the display size
        const scaledX = x * scaleFactors.scaleX;
        const scaledY = y * scaleFactors.scaleY;
        const scaledWidth = width * scaleFactors.scaleX;
        const scaledHeight = height * scaleFactors.scaleY;
        
        return (
          <div
            key={detection.id}
            className="absolute border-2 border-blue-500 cursor-move pointer-events-auto"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              transform: `rotate(${detection.userRotation}deg)`,
              transformOrigin: `${center.x - scaledX}px ${center.y - scaledY}px`,
            }}
            onMouseDown={(event) => onDivMouseDown(event, detection)}
          />
        );
      })}
    </div>
  );
}; 