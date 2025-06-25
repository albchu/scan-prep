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

// ===== PHASE 1: CORE GEOMETRY UTILITIES FOR SPATIAL EDGE-FIXED RESIZE =====

/**
 * Transform a point by rotating it around origin by given angle
 * @param point - The point to rotate (x, y coordinates)
 * @param angleInDegrees - Rotation angle in degrees (positive = clockwise in +y downward systems)
 * @returns The rotated point
 */
export function rotatePoint(point: Point, angleInDegrees: number): Point {
  const angleRad = (angleInDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

/**
 * Apply inverse rotation to transform mouse delta to frame's local coordinate system
 * @param mouseDelta - Mouse movement delta in global coordinates
 * @param frameRotation - Frame's rotation in degrees
 * @returns Mouse delta transformed to frame's local coordinate system
 */
export function transformMouseDeltaToFrameLocal(
  mouseDelta: Point, 
  frameRotation: number
): Point {
  const angleRad = (-frameRotation * Math.PI) / 180; // Inverse rotation
  return {
    x: mouseDelta.x * Math.cos(angleRad) - mouseDelta.y * Math.sin(angleRad),
    y: mouseDelta.x * Math.sin(angleRad) + mouseDelta.y * Math.cos(angleRad)
  };
}

/**
 * Calculate the four corner points of a rotated frame
 * @param frameCenter - Center point of the frame
 * @param frameWidth - Unrotated width of the frame
 * @param frameHeight - Unrotated height of the frame
 * @param frameRotation - Rotation angle in degrees
 * @returns Array of corner points [topLeft, topRight, bottomRight, bottomLeft]
 */
export function calculateRotatedCorners(
  frameCenter: Point,
  frameWidth: number,
  frameHeight: number,
  frameRotation: number
): Point[] {
  const halfWidth = frameWidth / 2;
  const halfHeight = frameHeight / 2;
  const angleRad = (frameRotation * Math.PI) / 180;
  
  const localCorners = [
    {x: -halfWidth, y: -halfHeight}, // topLeft
    {x: halfWidth, y: -halfHeight},  // topRight
    {x: halfWidth, y: halfHeight},   // bottomRight  
    {x: -halfWidth, y: halfHeight}   // bottomLeft
  ];
  
  return localCorners.map(corner => ({
    x: frameCenter.x + corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad),
    y: frameCenter.y + corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad)
  }));
}

// ===== PHASE 2: FRAME ANALYSIS FUNCTIONS FOR SPATIAL EDGE-FIXED RESIZE =====

/**
 * Get the center point of a specific edge of a rotated frame
 * @param rotatedCorners - The four corner points of the rotated frame
 * @param edge - Which edge to get the center of
 * @returns Center point of the specified edge
 */
export function getFixedEdgeCenter(
  rotatedCorners: Point[],
  edge: 'top' | 'right' | 'bottom' | 'left'
): Point {
  const edgeCornerMap = {
    'top': [rotatedCorners[0], rotatedCorners[1]], // topLeft, topRight
    'right': [rotatedCorners[1], rotatedCorners[2]], // topRight, bottomRight  
    'bottom': [rotatedCorners[2], rotatedCorners[3]], // bottomRight, bottomLeft
    'left': [rotatedCorners[3], rotatedCorners[0]] // bottomLeft, topLeft
  };
  
  const [p1, p2] = edgeCornerMap[edge];
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2  
  };
}

/**
 * Determine which logical edge should be resized based on drag direction
 * @param rotation - Frame rotation in degrees
 * @param dragDirection - Normalized drag direction vector
 * @returns The logical edge that best matches the drag direction
 */
export function getResizeEdgeMapping(
  rotation: number, 
  dragDirection: Point
): 'top' | 'right' | 'bottom' | 'left' {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  
  // Calculate edge normals (outward pointing)
  const angleRad = (normalizedRotation * Math.PI) / 180;
  const edgeNormals = {
    top: { x: -Math.sin(angleRad), y: -Math.cos(angleRad) },
    right: { x: Math.cos(angleRad), y: -Math.sin(angleRad) },
    bottom: { x: Math.sin(angleRad), y: Math.cos(angleRad) },
    left: { x: -Math.cos(angleRad), y: Math.sin(angleRad) }
  };
  
  // Find edge normal most aligned with drag direction
  let bestEdge: 'top' | 'right' | 'bottom' | 'left' = 'top';
  let bestDot = -Infinity;
  
  for (const [edge, normal] of Object.entries(edgeNormals)) {
    const dot = dragDirection.x * normal.x + dragDirection.y * normal.y;
    if (dot > bestDot) {
      bestDot = dot;
      bestEdge = edge as 'top' | 'right' | 'bottom' | 'left';
    }
  }
  
  return bestEdge;
}

/**
 * Get the opposite edge for a given edge
 * @param edge - The edge to get the opposite of
 * @returns The opposite edge
 */
export function getOppositeEdge(edge: 'top' | 'right' | 'bottom' | 'left'): 'top' | 'right' | 'bottom' | 'left' {
  const opposites = {
    'top': 'bottom' as const,
    'right': 'left' as const,
    'bottom': 'top' as const,
    'left': 'right' as const
  };
  return opposites[edge];
}

// ===== PHASE 3: SPATIAL RESIZE ALGORITHM FOR SPATIAL EDGE-FIXED RESIZE =====

/**
 * Calculate new frame dimensions based on resize operation
 * @param originalWidth - Current frame width
 * @param originalHeight - Current frame height
 * @param resizeEdge - Which edge is being resized
 * @param localMouseDelta - Mouse delta in frame local coordinates
 * @param minWidth - Minimum allowed width
 * @param minHeight - Minimum allowed height
 * @returns New frame dimensions
 */
export function calculateNewFrameDimensions(
  originalWidth: number,
  originalHeight: number, 
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  localMouseDelta: Point,
  minWidth: number = 20,
  minHeight: number = 20
): {width: number, height: number} {
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  switch(resizeEdge) {
    case 'top':
      newHeight = originalHeight - localMouseDelta.y;
      break;
    case 'right':  
      newWidth = originalWidth + localMouseDelta.x;
      break;
    case 'bottom':
      newHeight = originalHeight + localMouseDelta.y;
      break;
    case 'left':
      newWidth = originalWidth - localMouseDelta.x;
      break;
  }
  
  // Prevent negative sizes that would flip the object
  newWidth = Math.max(minWidth, newWidth);
  newHeight = Math.max(minHeight, newHeight);
  
  return { width: newWidth, height: newHeight };
}

/**
 * Calculate new frame center that maintains fixed edge constraint
 * @param fixedEdgeCenter - Center point of the edge that should remain fixed
 * @param newWidth - New frame width
 * @param newHeight - New frame height
 * @param frameRotation - Frame rotation in degrees
 * @param resizeEdge - Which edge was resized
 * @returns New frame center point
 */
export function calculateNewFrameCenter(
  fixedEdgeCenter: Point,
  newWidth: number,
  newHeight: number,
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left'
): Point {
  // Distance from center to each edge in local coordinates
  const localDistances = {
    'top': {x: 0, y: -newHeight/2},
    'right': {x: newWidth/2, y: 0},
    'bottom': {x: 0, y: newHeight/2}, 
    'left': {x: -newWidth/2, y: 0}
  };
  
  // Use resizeEdge directly (vector from resized edge to center)
  const localDistance = localDistances[resizeEdge];
  
  // Transform distance from local to global coordinates
  const angleRad = (frameRotation * Math.PI) / 180;
  const globalDistance = {
    x: localDistance.x * Math.cos(angleRad) - localDistance.y * Math.sin(angleRad),
    y: localDistance.x * Math.sin(angleRad) + localDistance.y * Math.cos(angleRad)
  };
  
  // New center = fixed edge center + distance from resized edge to center
  return {
    x: fixedEdgeCenter.x + globalDistance.x,
    y: fixedEdgeCenter.y + globalDistance.y
  };
}

/**
 * Calculate axis-aligned bounding box from rotated frame
 * @param frameCenter - Center point of the frame
 * @param frameWidth - Unrotated width of the frame
 * @param frameHeight - Unrotated height of the frame
 * @param frameRotation - Frame rotation in degrees
 * @returns Axis-aligned bounding box that contains the rotated frame
 */
export function calculateAxisAlignedBoundingBox(
  frameCenter: Point,
  frameWidth: number, 
  frameHeight: number,
  frameRotation: number
): BoundingBox {
  // IMPORTANT: frameWidth and frameHeight must be the unrotated (local) dimensions
  const corners = calculateRotatedCorners(frameCenter, frameWidth, frameHeight, frameRotation);
  
  // Find axis-aligned bounding box that contains all corners
  const minX = Math.min(...corners.map(c => c.x));
  const maxX = Math.max(...corners.map(c => c.x));
  const minY = Math.min(...corners.map(c => c.y));
  const maxY = Math.max(...corners.map(c => c.y));
  
  return {
    x: minX,
    y: minY, 
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Calculate new bounding box for spatial edge-fixed resize
 * @param originalBoundingBox - Current axis-aligned bounding box
 * @param frameRotation - Frame rotation in degrees
 * @param resizeEdge - Which edge is being resized
 * @param mouseDelta - Mouse movement delta in display coordinates
 * @param scaleFactors - Scale factors for coordinate conversion
 * @param minWidth - Minimum allowed width
 * @param minHeight - Minimum allowed height
 * @returns New axis-aligned bounding box
 */
export function calculateSpatialEdgeFixedResize(
  originalBoundingBox: BoundingBox,
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  // Step 1: Convert mouse delta to image coordinates
  const imageDelta = {
    x: mouseDelta.x / scaleFactors.scaleX,
    y: mouseDelta.y / scaleFactors.scaleY
  };
  
  // Step 2: Transform to frame local coordinates  
  const localDelta = transformMouseDeltaToFrameLocal(imageDelta, frameRotation);
  
  // Step 3: Calculate new frame dimensions
  const newDimensions = calculateNewFrameDimensions(
    originalBoundingBox.width,
    originalBoundingBox.height,
    resizeEdge,
    localDelta,
    minWidth,
    minHeight
  );
  
  // Step 4: Get current rotated corners
  const currentCenter = {
    x: originalBoundingBox.x + originalBoundingBox.width / 2,
    y: originalBoundingBox.y + originalBoundingBox.height / 2
  };
  const rotatedCorners = calculateRotatedCorners(
    currentCenter, 
    originalBoundingBox.width,
    originalBoundingBox.height, 
    frameRotation
  );
  
  // Step 5: Identify fixed edge and its center
  const oppositeEdge = getOppositeEdge(resizeEdge);
  const fixedEdgeCenter = getFixedEdgeCenter(rotatedCorners, oppositeEdge);
  
  // Step 6: Calculate new frame center
  const newFrameCenter = calculateNewFrameCenter(
    fixedEdgeCenter,
    newDimensions.width,
    newDimensions.height, 
    frameRotation,
    resizeEdge
  );
  
  // Step 7: Calculate new axis-aligned bounding box
  const newBoundingBox = calculateAxisAlignedBoundingBox(
    newFrameCenter,
    newDimensions.width,
    newDimensions.height,
    frameRotation
  );
  
  return newBoundingBox;
} 