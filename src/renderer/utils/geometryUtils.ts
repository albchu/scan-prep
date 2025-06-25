import { ViewportFrame, BoundingBox } from '@shared/types';

export interface Point {
  x: number;
  y: number;
}

export interface DisplayDimensions {
  width: number;
  height: number;
}

export interface ScaleFactors {
  scaleX: number;
  scaleY: number;
}

/**
 * Calculate scale factors for transforming image coordinates to display coordinates
 */
export function calculateScaleFactors(
  imageWidth: number,
  imageHeight: number,
  displayWidth: number,
  displayHeight: number
): ScaleFactors {
  return {
    scaleX: displayWidth / imageWidth,
    scaleY: displayHeight / imageHeight,
  };
}

/**
 * Calculate the center point of a bounding box in display coordinates
 */
export function getBoundingBoxCenter(
  boundingBox: ViewportFrame['boundingBox'],
  scaleFactors: ScaleFactors
): Point {
  return {
    x: (boundingBox.x + boundingBox.width / 2) * scaleFactors.scaleX,
    y: (boundingBox.y + boundingBox.height / 2) * scaleFactors.scaleY,
  };
}

/**
 * Calculate angle between two points in degrees
 */
export function calculateAngleBetweenPoints(
  centerX: number,
  centerY: number,
  targetX: number,
  targetY: number
): number {
  return Math.atan2(targetY - centerY, targetX - centerX) * (180 / Math.PI);
}

/**
 * Normalize angle to -180 to 180 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

/**
 * Calculate rotated rectangle corners
 */
export function getRotatedRectangleCorners(
  boundingBox: ViewportFrame['boundingBox'],
  rotation: number,
  scaleFactors: ScaleFactors
): Point[] {
  const centerX = (boundingBox.x + boundingBox.width / 2) * scaleFactors.scaleX;
  const centerY = (boundingBox.y + boundingBox.height / 2) * scaleFactors.scaleY;
  const width = boundingBox.width * scaleFactors.scaleX;
  const height = boundingBox.height * scaleFactors.scaleY;
  
  const angleRad = (rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Calculate corners relative to center, then rotate
  const corners = [
    { x: -halfWidth, y: -halfHeight }, // Top-left
    { x: halfWidth, y: -halfHeight },  // Top-right
    { x: halfWidth, y: halfHeight },   // Bottom-right
    { x: -halfWidth, y: halfHeight },  // Bottom-left
  ].map(corner => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
  
  return corners;
}

/**
 * Calculate rotation handle positions for all four corners
 */
export function getAllRotationHandlePositions(
  corners: Point[],
  center: Point,
  handleOffset: number = 20
): Point[] {
  // The corners array has this order: [topLeft, topRight, bottomRight, bottomLeft]
  return corners.map(corner => {
    const angle = Math.atan2(corner.y - center.y, corner.x - center.x);
    
    return {
      x: corner.x + Math.cos(angle) * handleOffset,
      y: corner.y + Math.sin(angle) * handleOffset,
    };
  });
}

/**
 * Calculate rotation handle position (offset from top-right corner)
 */
export function getRotationHandlePosition(
  corners: Point[],
  center: Point,
  handleOffset: number = 20
): Point {
  const topRight = corners[1]; // Top-right corner
  
  // Calculate angle from center to top-right corner
  const angle = Math.atan2(topRight.y - center.y, topRight.x - center.x);
  
  return {
    x: topRight.x + Math.cos(angle) * handleOffset,
    y: topRight.y + Math.sin(angle) * handleOffset,
  };
}

/**
 * Get mouse position relative to an SVG element
 */
export function getMousePositionRelativeToSVG(
  event: React.MouseEvent | MouseEvent,
  svgElement: SVGSVGElement | null
): Point {
  if (!svgElement) return { x: 0, y: 0 };
  
  const rect = svgElement.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

/**
 * Get mouse position relative to any HTML element
 */
export function getMousePositionRelativeToElement(
  event: React.MouseEvent | MouseEvent,
  element: HTMLElement | null
): Point {
  if (!element) return { x: 0, y: 0 };
  
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

/**
 * Create SVG path data for a polygon
 */
export function createPolygonPath(points: Point[]): string {
  if (points.length === 0) return '';
  
  const pathCommands = [
    `M ${points[0].x} ${points[0].y}`,
    ...points.slice(1).map(point => `L ${point.x} ${point.y}`),
    'Z'
  ];
  
  return pathCommands.join(' ');
}

/**
 * Calculate new bounding box based on edge resize
 */
export function calculateResizedBoundingBox(
  originalBox: BoundingBox,
  edge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  const newBox = { ...originalBox };
  
  // Convert mouse delta from display coordinates to image coordinates
  const imageDeltaX = mouseDelta.x / scaleFactors.scaleX;
  const imageDeltaY = mouseDelta.y / scaleFactors.scaleY;
  
  switch (edge) {
    case 'top':
      newBox.y += imageDeltaY;
      newBox.height -= imageDeltaY;
      // Enforce minimum height
      if (newBox.height < minHeight) {
        newBox.y = originalBox.y + originalBox.height - minHeight;
        newBox.height = minHeight;
      }
      break;
      
    case 'right':
      newBox.width += imageDeltaX;
      // Enforce minimum width
      if (newBox.width < minWidth) {
        newBox.width = minWidth;
      }
      break;
      
    case 'bottom':
      newBox.height += imageDeltaY;
      // Enforce minimum height
      if (newBox.height < minHeight) {
        newBox.height = minHeight;
      }
      break;
      
    case 'left':
      newBox.x += imageDeltaX;
      newBox.width -= imageDeltaX;
      // Enforce minimum width
      if (newBox.width < minWidth) {
        newBox.x = originalBox.x + originalBox.width - minWidth;
        newBox.width = minWidth;
      }
      break;
  }
  
  return newBox;
}

/**
 * Validate bounding box constraints
 */
export function validateBoundingBox(
  boundingBox: BoundingBox,
  imageWidth: number,
  imageHeight: number,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  const validated = { ...boundingBox };
  
  // Ensure minimum dimensions
  validated.width = Math.max(validated.width, minWidth);
  validated.height = Math.max(validated.height, minHeight);
  
  // Ensure within image boundaries
  validated.x = Math.max(0, Math.min(validated.x, imageWidth - validated.width));
  validated.y = Math.max(0, Math.min(validated.y, imageHeight - validated.height));
  
  // Ensure doesn't exceed image boundaries
  if (validated.x + validated.width > imageWidth) {
    validated.width = imageWidth - validated.x;
  }
  if (validated.y + validated.height > imageHeight) {
    validated.height = imageHeight - validated.y;
  }
  
  return validated;
} 