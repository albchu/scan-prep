import React from 'react';
import { DetectedSubImage } from '@shared/types';
import { Point } from '../../utils';

interface RotationHandleProps {
  detection: DetectedSubImage;
  position: Point;
  corners: Point[];
  onMouseDown: (event: React.MouseEvent, detection: DetectedSubImage) => void;
  strokeColor?: string;
  size?: number;
}

export const RotationHandle: React.FC<RotationHandleProps> = ({
  detection,
  position,
  corners,
  onMouseDown,
  strokeColor = '#ff6b35',
  size = 12,
}) => {
  const topRightCorner = corners[1]; // Top-right corner for connection line
  
  return (
    <g>
      {/* Connection line from corner to handle */}
      <line
        x1={topRightCorner.x}
        y1={topRightCorner.y}
        x2={position.x}
        y2={position.y}
        stroke={strokeColor}
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="3,3"
      />
      
      {/* Rotation handle */}
      <g 
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onMouseDown(e, detection)}
      >
        {/* Handle background circle */}
        <circle
          cx={position.x}
          cy={position.y}
          r={size}
          fill="white"
          stroke={strokeColor}
          strokeWidth="2"
          opacity="0.9"
        />
        
        {/* Rotation icon */}
        <RotationIcon
          centerX={position.x}
          centerY={position.y}
          strokeColor={strokeColor}
          size={size * 0.5}
        />
      </g>
    </g>
  );
};

interface RotationIconProps {
  centerX: number;
  centerY: number;
  strokeColor: string;
  size: number;
}

const RotationIcon: React.FC<RotationIconProps> = ({
  centerX,
  centerY,
  strokeColor,
  size,
}) => {
  const radius = size;
  
  return (
    <path
      d={`M ${centerX - radius} ${centerY - size/2} 
          A ${radius} ${radius} 0 1 1 ${centerX + size/2} ${centerY - radius}
          L ${centerX + radius} ${centerY - radius}
          L ${centerX + size/2} ${centerY - radius * 1.5}
          M ${centerX + radius} ${centerY + size/2}
          A ${radius} ${radius} 0 1 1 ${centerX - size/2} ${centerY + radius}
          L ${centerX - radius} ${centerY + radius}
          L ${centerX - size/2} ${centerY + radius * 1.5}`}
      stroke={strokeColor}
      strokeWidth="1.5"
      fill="none"
    />
  );
}; 