import React from 'react';
import { ViewportFrame } from '@shared/types';
import { Point, createPolygonPath } from '../../utils';

interface ViewportFrameShapeProps {
  viewportFrame: ViewportFrame;
  corners: Point[];
  center: Point;
  isSelected?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const ViewportFrameShape: React.FC<ViewportFrameShapeProps> = ({
  viewportFrame,
  corners,
  center,
  isSelected = false,
  strokeColor = '#ff6b35',
  strokeWidth = 2,
  opacity = 0.8,
}) => {
  const pathData = createPolygonPath(corners);
  
  return (
    <g>
      {/* Viewport frame rectangle */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? strokeWidth + 1 : strokeWidth}
        opacity={opacity}
        strokeDasharray={isSelected ? '5,5' : undefined}
      />
      
      {/* Center point indicator */}
      <circle
        cx={center.x}
        cy={center.y}
        r={isSelected ? 4 : 3}
        fill={strokeColor}
        opacity={opacity * 0.75}
      />
      
      {/* Rotation angle label */}
      {Math.abs(viewportFrame.rotation) > 1 && (
        <text
          x={center.x}
          y={center.y - 15}
          textAnchor="middle"
          fontSize="12"
          fill={strokeColor}
          fontWeight="bold"
          opacity={opacity}
        >
          {Math.round(viewportFrame.rotation)}°
        </text>
      )}
    </g>
  );
}; 