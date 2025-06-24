import React, { useRef } from 'react';
import { ViewportFrame } from '@shared/types';
import { 
  calculateScaleFactors,
  getBoundingBoxCenter,
} from '../../utils';
import { useRotationDrag } from '../../hooks/useRotationDrag';

interface InteractiveViewportFrameOverlayProps {
  viewportFrames: ViewportFrame[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  onRotationChange: (frameId: string, newRotation: number) => void;
  onBackgroundClick: (event: React.MouseEvent<Element, MouseEvent>) => void;
}

export const InteractiveViewportFrameOverlay: React.FC<InteractiveViewportFrameOverlayProps> = ({
  viewportFrames,
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
    viewportFrames,
    scaleFactors,
    onRotationChange,
  });

  const onDivMouseDown = (event: React.MouseEvent, viewportFrame: ViewportFrame) => {
    // Stop propagation here to prevent background click
    event.stopPropagation();
    handleRotationStart(event, viewportFrame, overlayRef.current);
  };

  // Handle clicks on the overlay (not on viewport frames)
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
      {viewportFrames.map((viewportFrame) => {
        const { x, y, width, height } = viewportFrame.boundingBox;
        const center = getBoundingBoxCenter(viewportFrame.boundingBox, scaleFactors);
        
        // Scale the position and size to match the display size
        const scaledX = x * scaleFactors.scaleX;
        const scaledY = y * scaleFactors.scaleY;
        const scaledWidth = width * scaleFactors.scaleX;
        const scaledHeight = height * scaleFactors.scaleY;
        
        return (
          <div
            key={viewportFrame.id}
            className="absolute border-2 border-blue-500 cursor-move pointer-events-auto"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              transform: `rotate(${viewportFrame.rotation}deg)`,
              transformOrigin: `${center.x - scaledX}px ${center.y - scaledY}px`,
            }}
            onMouseDown={(event) => onDivMouseDown(event, viewportFrame)}
          />
        );
      })}
    </div>
  );
}; 