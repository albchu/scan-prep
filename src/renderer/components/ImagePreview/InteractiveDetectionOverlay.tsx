import React, { useRef } from 'react';
import { DetectedSubImage } from '@shared/types';
import { 
  calculateScaleFactors,
  getBoundingBoxCenter,
  getRotatedRectangleCorners,
  getRotationHandlePosition,
} from '../../utils';
import { useRotationDrag } from '../../hooks/useRotationDrag';
import { DetectionShape } from './DetectionShape';
import { RotationHandle } from './RotationHandle';

interface InteractiveDetectionOverlayProps {
  detectedImages: DetectedSubImage[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  onRotationChange: (detectionId: string, newRotation: number) => void;
}

export const InteractiveDetectionOverlay: React.FC<InteractiveDetectionOverlayProps> = ({
  detectedImages,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  onRotationChange,
}) => {
  const overlayRef = useRef<SVGSVGElement>(null);

  // Calculate scale factors
  const scaleFactors = calculateScaleFactors(imageWidth, imageHeight, displayWidth, displayHeight);

  // Use rotation drag hook
  const { handleRotationStart, handleRotationDrag, handleRotationEnd } = useRotationDrag({
    detectedImages,
    scaleFactors,
    onRotationChange,
  });

  // Handle mouse events with SVG element reference
  const onMouseMove = (event: React.MouseEvent) => {
    handleRotationDrag(event, overlayRef.current);
  };

  const onMouseUp = () => {
    handleRotationEnd();
  };

  const onMouseLeave = () => {
    handleRotationEnd();
  };

  const onRotationHandleMouseDown = (event: React.MouseEvent, detection: DetectedSubImage) => {
    handleRotationStart(event, detection, overlayRef.current);
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: displayWidth, height: displayHeight }}>
      <svg
        ref={overlayRef}
        width={displayWidth}
        height={displayHeight}
        className="absolute top-0 left-0"
        style={{ width: displayWidth, height: displayHeight }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {detectedImages.map((detection) => {
          const corners = getRotatedRectangleCorners(detection.boundingBox, detection.userRotation, scaleFactors);
          const center = getBoundingBoxCenter(detection.boundingBox, scaleFactors);
          const handlePosition = getRotationHandlePosition(corners, center);
          
          return (
            <g key={detection.id}>
              <DetectionShape
                detection={detection}
                corners={corners}
                center={center}
              />
              
              <RotationHandle
                detection={detection}
                position={handlePosition}
                corners={corners}
                onMouseDown={onRotationHandleMouseDown}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}; 