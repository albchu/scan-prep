import React from 'react';
import { DetectedSubImage } from '@shared/types';

interface BasicDetectionOverlayProps {
  detectedImages: DetectedSubImage[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
}

export const BasicDetectionOverlay: React.FC<BasicDetectionOverlayProps> = ({
  detectedImages,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
}) => {
  // Calculate scale factors
  const scaleX = displayWidth / imageWidth;
  const scaleY = displayHeight / imageHeight;
  
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: displayWidth, height: displayHeight }}>
      <svg 
        width={displayWidth} 
        height={displayHeight} 
        className="absolute top-0 left-0"
        style={{ width: displayWidth, height: displayHeight }}
      >
        {detectedImages.map((detection) => {
          const { x, y, width, height } = detection.boundingBox;
          
          // Scale the coordinates to match display size
          const scaledX = x * scaleX;
          const scaledY = y * scaleY;
          const scaledWidth = width * scaleX;
          const scaledHeight = height * scaleY;
          
          return (
            <g key={detection.id}>
              {/* Detection rectangle */}
              <rect
                x={scaledX}
                y={scaledY}
                width={scaledWidth}
                height={scaledHeight}
                fill="none"
                stroke="#ff6b35"
                strokeWidth="3"
                opacity="0.8"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}; 