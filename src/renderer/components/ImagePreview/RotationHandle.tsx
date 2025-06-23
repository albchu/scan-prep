import React from 'react';
import { DetectedSubImage } from '@shared/types';
import { Point } from '../../utils';
import { RotationArrow } from './RotationArrow';

interface RotationHandleProps {
  detection: DetectedSubImage;
  corners: Point[];
  cornerIndex: number;
  onMouseDown: (event: React.MouseEvent, detection: DetectedSubImage) => void;
}

export const RotationHandle: React.FC<RotationHandleProps> = ({
  detection,
  corners,
  cornerIndex,
  onMouseDown,
}) => {
  // Get the corresponding corner
  const corner = corners[cornerIndex];
  
  return (
    <g 
      className="pointer-events-auto cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => onMouseDown(e, detection)}
    >
      {/* Rotation arrow placed directly at the corner */}
      <RotationArrow
        position={corner}
        cornerIndex={cornerIndex}
        rotation={detection.userRotation}
        size={24}
      />
    </g>
  );
}; 