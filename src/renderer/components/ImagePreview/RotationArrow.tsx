import React from 'react';
import { Point } from '../../utils';

interface RotationArrowProps {
  position: Point;
  cornerIndex: number;
  rotation: number;
  strokeColor?: string;
  strokeWidth?: number;
  size?: number;
}

/**
 * Component to render curved arrows for rotation UI
 * cornerIndex: 0=topLeft, 1=topRight, 2=bottomRight, 3=bottomLeft
 */
export const RotationArrow: React.FC<RotationArrowProps> = ({
  position,
  cornerIndex,
  rotation,
  strokeColor = '#1a1a1a',
  strokeWidth = 3,
  size = 24,
}) => {
  // Calculate path based on corner position
  const getArrowPath = () => {
    // Position the arrow directly at the corner
    const { x, y } = position;
    
    // Arrow paths for each corner - these match the design image
    switch (cornerIndex) {
      case 0: // top-left
        return {
          curve: `M ${x - size} ${y} A ${size} ${size} 0 0 1 ${x} ${y - size}`,
          arrow1: `M ${x - size/2} ${y} L ${x - size} ${y} L ${x - size} ${y - size/2}`,
          arrow2: `M ${x} ${y - size/2} L ${x} ${y - size} L ${x - size/2} ${y - size}`
        };
      case 1: // top-right
        return {
          curve: `M ${x} ${y - size} A ${size} ${size} 0 0 1 ${x + size} ${y}`,
          arrow1: `M ${x + size/2} ${y - size} L ${x} ${y - size} L ${x} ${y - size/2}`,
          arrow2: `M ${x + size/2} ${y} L ${x + size} ${y} L ${x + size} ${y - size/2}`
        };
      case 2: // bottom-right
        return {
          curve: `M ${x + size} ${y} A ${size} ${size} 0 0 1 ${x} ${y + size}`,
          arrow1: `M ${x + size/2} ${y} L ${x + size} ${y} L ${x + size} ${y + size/2}`,
          arrow2: `M ${x} ${y + size/2} L ${x} ${y + size} L ${x + size/2} ${y + size}`
        };
      case 3: // bottom-left
        return {
          curve: `M ${x} ${y + size} A ${size} ${size} 0 0 1 ${x - size} ${y}`,
          arrow1: `M ${x - size/2} ${y + size} L ${x} ${y + size} L ${x} ${y + size/2}`,
          arrow2: `M ${x - size/2} ${y} L ${x - size} ${y} L ${x - size} ${y + size/2}`
        };
      default:
        return { curve: '', arrow1: '', arrow2: '' };
    }
  };
  
  const paths = getArrowPath();

  return (
    <g className="rotation-arrow" transform={`rotate(${rotation}, ${position.x}, ${position.y})`}>
      <path
        d={paths.curve}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={paths.arrow1}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={paths.arrow2}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}; 