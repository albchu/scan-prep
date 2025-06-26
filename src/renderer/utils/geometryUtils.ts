import { ViewportFrame, BoundingBox, FrameEdge } from '@shared/types';

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

// ===== CORE REUSABLE UTILITIES =====

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Apply rotation transformation to a point around origin
 * @param point - Point to transform
 * @param angleRad - Rotation angle in radians
 * @returns Transformed point
 */
export function applyRotationMatrix(point: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

/**
 * Apply inverse rotation transformation to a point around origin
 * @param point - Point to transform
 * @param angleRad - Original rotation angle in radians (will be inverted)
 * @returns Transformed point
 */
export function applyInverseRotationMatrix(point: Point, angleRad: number): Point {
  return applyRotationMatrix(point, -angleRad);
}

/**
 * Calculate center point of a rectangle
 * @param x - Rectangle x position
 * @param y - Rectangle y position  
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @returns Center point
 */
export function calculateRectangleCenter(x: number, y: number, width: number, height: number): Point {
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
}

/**
 * Transform point from one coordinate system to another using scale factors
 * @param point - Point to transform
 * @param scaleFactors - Scale transformation to apply
 * @returns Transformed point
 */
export function applyScaleTransform(point: Point, scaleFactors: ScaleFactors): Point {
  return {
    x: point.x * scaleFactors.scaleX,
    y: point.y * scaleFactors.scaleY,
  };
}

/**
 * Apply inverse scale transformation to a point
 * @param point - Point to transform
 * @param scaleFactors - Original scale factors (will be inverted)
 * @returns Transformed point
 */
export function applyInverseScaleTransform(point: Point, scaleFactors: ScaleFactors): Point {
  return {
    x: point.x / scaleFactors.scaleX,
    y: point.y / scaleFactors.scaleY,
  };
}

/**
 * Calculate the four corner points of an axis-aligned rectangle
 * @param center - Center point of the rectangle
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @returns Array of corner points [topLeft, topRight, bottomRight, bottomLeft]
 */
export function calculateAxisAlignedCorners(center: Point, width: number, height: number): Point[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  return [
    { x: center.x - halfWidth, y: center.y - halfHeight }, // topLeft
    { x: center.x + halfWidth, y: center.y - halfHeight }, // topRight
    { x: center.x + halfWidth, y: center.y + halfHeight }, // bottomRight
    { x: center.x - halfWidth, y: center.y + halfHeight }, // bottomLeft
  ];
}

// ===== EXISTING FUNCTIONS REFACTORED TO USE UTILITIES =====

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
  const center = calculateRectangleCenter(
    boundingBox.x,
    boundingBox.y,
    boundingBox.width,
    boundingBox.height
  );
  return applyScaleTransform(center, scaleFactors);
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
  return radiansToDegrees(Math.atan2(targetY - centerY, targetX - centerX));
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
 * Calculate new bounding box based on edge resize (wrapper function)
 * This function chooses between axis-aligned and spatial edge-fixed resize algorithms
 * based on whether the frame is rotated.
 */
export function calculateResizedBoundingBox(
  originalBox: BoundingBox,
  edge: FrameEdge,
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  frameRotation: number = 0,
  imageWidth: number = Infinity,
  imageHeight: number = Infinity,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  // For non-rotated frames, use the existing simple algorithm
  if (frameRotation === 0) {
    return calculateAxisAlignedResize(
      originalBox,
      edge,
      mouseDelta,
      scaleFactors,
      minWidth,
      minHeight
    );
  }
  
  // For rotated frames, use the spatial edge-fixed algorithm with boundary validation
  return calculateSpatialEdgeFixedResize(
    originalBox,
    frameRotation,
    edge,
    mouseDelta,
    scaleFactors,
    imageWidth,
    imageHeight,
    minWidth,
    minHeight
  );
}

/**
 * Calculate new bounding box based on edge resize (axis-aligned algorithm)
 * This is the original algorithm for non-rotated frames.
 */
function calculateAxisAlignedResize(
  originalBox: BoundingBox,
  edge: FrameEdge,
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  const newBox = { ...originalBox };
  
  // Convert mouse delta from display coordinates to image coordinates
  const imageDelta = applyInverseScaleTransform(mouseDelta, scaleFactors);
  
  switch (edge) {
    case 'top':
      newBox.y += imageDelta.y;
      newBox.height -= imageDelta.y;
      // Enforce minimum height
      if (newBox.height < minHeight) {
        newBox.y = originalBox.y + originalBox.height - minHeight;
        newBox.height = minHeight;
      }
      break;
      
    case 'right':
      newBox.width += imageDelta.x;
      // Enforce minimum width
      if (newBox.width < minWidth) {
        newBox.width = minWidth;
      }
      break;
      
    case 'bottom':
      newBox.height += imageDelta.y;
      // Enforce minimum height
      if (newBox.height < minHeight) {
        newBox.height = minHeight;
      }
      break;
      
    case 'left':
      newBox.x += imageDelta.x;
      newBox.width -= imageDelta.x;
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
 * Apply inverse rotation to transform mouse delta to frame's local coordinate system
 * @param mouseDelta - Mouse movement delta in global coordinates
 * @param frameRotation - Frame's rotation in degrees
 * @returns Mouse delta transformed to frame's local coordinate system
 */
export function transformMouseDeltaToFrameLocal(
  mouseDelta: Point, 
  frameRotation: number
): Point {
  return applyInverseRotationMatrix(mouseDelta, degreesToRadians(frameRotation));
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
  // Get axis-aligned corners relative to origin
  const localCorners = calculateAxisAlignedCorners({ x: 0, y: 0 }, frameWidth, frameHeight);
  
  // Apply rotation and translate to actual center
  const angleRad = degreesToRadians(frameRotation);
  return localCorners.map(corner => {
    const rotated = applyRotationMatrix(corner, angleRad);
    return {
      x: frameCenter.x + rotated.x,
      y: frameCenter.y + rotated.y,
    };
  });
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
  edge: FrameEdge
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
): FrameEdge {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const angleRad = degreesToRadians(normalizedRotation);
  
  // Calculate edge normals (outward pointing) using rotation matrix
  const edgeNormals = {
    top: applyRotationMatrix({ x: 0, y: -1 }, angleRad),
    right: applyRotationMatrix({ x: 1, y: 0 }, angleRad),
    bottom: applyRotationMatrix({ x: 0, y: 1 }, angleRad),
    left: applyRotationMatrix({ x: -1, y: 0 }, angleRad)
  };
  
  // Find edge normal most aligned with drag direction
  let bestEdge: FrameEdge = 'top';
  let bestDot = -Infinity;
  
  for (const [edge, normal] of Object.entries(edgeNormals)) {
    const dot = dragDirection.x * normal.x + dragDirection.y * normal.y;
    if (dot > bestDot) {
      bestDot = dot;
      bestEdge = edge as FrameEdge;
    }
  }
  
  return bestEdge;
}

/**
 * Get the opposite edge for a given edge
 * @param edge - The edge to get the opposite of
 * @returns The opposite edge
 */
export function getOppositeEdge(edge: FrameEdge): FrameEdge {
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
  resizeEdge: FrameEdge,
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
  resizeEdge: FrameEdge
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
  
  // Transform distance from local to global coordinates using rotation matrix
  const globalDistance = applyRotationMatrix(localDistance, degreesToRadians(frameRotation));
  
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

// ===== PHASE 6: BOUNDARY VALIDATION & POLISH =====

/**
 * Validate input parameters for spatial edge-fixed resize
 * @param boundingBox - Bounding box to validate
 * @param frameRotation - Frame rotation to validate
 * @param scaleFactors - Scale factors to validate
 * @returns True if all parameters are valid
 */
function validateSpatialResizeInputs(
  boundingBox: BoundingBox,
  frameRotation: number,
  scaleFactors: ScaleFactors
): boolean {
  // Validate bounding box
  if (!boundingBox || 
      typeof boundingBox.x !== 'number' || 
      typeof boundingBox.y !== 'number' ||
      typeof boundingBox.width !== 'number' || 
      typeof boundingBox.height !== 'number' ||
      boundingBox.width <= 0 || 
      boundingBox.height <= 0) {
    return false;
  }

  // Validate rotation
  if (typeof frameRotation !== 'number' || !isFinite(frameRotation)) {
    return false;
  }

  // Validate scale factors
  if (!scaleFactors || 
      typeof scaleFactors.scaleX !== 'number' || 
      typeof scaleFactors.scaleY !== 'number' ||
      scaleFactors.scaleX <= 0 || 
      scaleFactors.scaleY <= 0) {
    return false;
  }

  return true;
}

/**
 * Validate bounding box against image boundaries while preserving fixed edge constraint
 * @param boundingBox - The bounding box to validate
 * @param fixedEdgeCenter - Center point of the edge that should remain fixed
 * @param frameDimensions - The frame dimensions (width, height)
 * @param frameRotation - Frame rotation in degrees
 * @param resizeEdge - Which edge was resized
 * @param imageWidth - Image width boundary
 * @param imageHeight - Image height boundary
 * @returns Validated bounding box that respects both image boundaries and fixed edge constraint
 */
export function validateImageBoundariesWithFixedEdge(
  boundingBox: BoundingBox,
  fixedEdgeCenter: Point,
  frameDimensions: {width: number, height: number},
  frameRotation: number,
  resizeEdge: FrameEdge,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  // If the bounding box is within boundaries, return as-is
  if (boundingBox.x >= 0 && 
      boundingBox.y >= 0 && 
      boundingBox.x + boundingBox.width <= imageWidth && 
      boundingBox.y + boundingBox.height <= imageHeight) {
    return boundingBox;
  }

  // Calculate the maximum dimensions that would fit within image boundaries
  // while maintaining the fixed edge constraint
  const constrainedDimensions = { ...frameDimensions };

  // For rotated frames, we need to be more careful about boundary constraints
  // Calculate what the maximum frame dimensions could be while keeping the fixed edge in place
  
  // Try to find the largest dimensions that would keep the bounding box within image bounds
  const maxIterations = 10; // Prevent infinite loops
  let iteration = 0;
  
  while (iteration < maxIterations) {
    // Recalculate frame center with current constrained dimensions
    const newFrameCenter = calculateNewFrameCenter(
      fixedEdgeCenter,
      constrainedDimensions.width,
      constrainedDimensions.height,
      frameRotation,
      resizeEdge
    );
    
    // Calculate the bounding box with constrained dimensions
    const testBoundingBox = calculateAxisAlignedBoundingBox(
      newFrameCenter,
      constrainedDimensions.width,
      constrainedDimensions.height,
      frameRotation
    );
    
    // Check if this bounding box fits within image boundaries
    if (testBoundingBox.x >= 0 && 
        testBoundingBox.y >= 0 && 
        testBoundingBox.x + testBoundingBox.width <= imageWidth && 
        testBoundingBox.y + testBoundingBox.height <= imageHeight) {
      // This configuration works, return it
      return testBoundingBox;
    }
    
    // If we're here, the bounding box still exceeds boundaries
    // Reduce dimensions by a small amount and try again
    const reductionFactor = 0.95;
    constrainedDimensions.width *= reductionFactor;
    constrainedDimensions.height *= reductionFactor;
    iteration++;
  }
  
  // If we couldn't find a valid configuration after iterations,
  // fall back to simple boundary clamping (may not preserve fixed edge perfectly)
  const clampedBox = {
    x: Math.max(0, Math.min(boundingBox.x, imageWidth - boundingBox.width)),
    y: Math.max(0, Math.min(boundingBox.y, imageHeight - boundingBox.height)),
    width: Math.min(boundingBox.width, imageWidth - Math.max(0, boundingBox.x)),
    height: Math.min(boundingBox.height, imageHeight - Math.max(0, boundingBox.y))
  };
  
  return clampedBox;
}

/**
 * Calculate new bounding box for spatial edge-fixed resize (with boundary validation)
 * @param originalBoundingBox - Current axis-aligned bounding box
 * @param frameRotation - Frame rotation in degrees
 * @param resizeEdge - Which edge is being resized
 * @param mouseDelta - Mouse movement delta in display coordinates
 * @param scaleFactors - Scale factors for coordinate conversion
 * @param imageWidth - Image width for boundary validation
 * @param imageHeight - Image height for boundary validation
 * @param minWidth - Minimum allowed width
 * @param minHeight - Minimum allowed height
 * @returns New axis-aligned bounding box with boundary validation
 */
export function calculateSpatialEdgeFixedResize(
  originalBoundingBox: BoundingBox,
  frameRotation: number,
  resizeEdge: FrameEdge,
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  imageWidth: number = Infinity,
  imageHeight: number = Infinity,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  // Input validation with error handling
  if (!validateSpatialResizeInputs(originalBoundingBox, frameRotation, scaleFactors)) {
    console.warn('Invalid inputs to calculateSpatialEdgeFixedResize, falling back to original bounding box');
    return originalBoundingBox;
  }

  // Performance optimization: for very small mouse movements, return original box
  const mouseDeltaMagnitude = Math.sqrt(mouseDelta.x * mouseDelta.x + mouseDelta.y * mouseDelta.y);
  if (mouseDeltaMagnitude < 0.5) {
    return originalBoundingBox;
  }

  try {
    // Step 1: Convert mouse delta to image coordinates
    const imageDelta = applyInverseScaleTransform(mouseDelta, scaleFactors);
    
    // Step 2: Transform to frame local coordinates  
    const localDelta = transformMouseDeltaToFrameLocal(imageDelta, frameRotation);
    
    // Step 3: Calculate the ORIGINAL frame dimensions (CRITICAL FIX)
    // The bounding box dimensions are axis-aligned, but we need the actual frame dimensions
    const originalFrameDimensions = calculateOriginalFrameDimensions(originalBoundingBox, frameRotation);
    
    // Step 4: Calculate new frame dimensions based on the ORIGINAL dimensions
    const newDimensions = calculateNewFrameDimensions(
      originalFrameDimensions.width,
      originalFrameDimensions.height,
      resizeEdge,
      localDelta,
      minWidth,
      minHeight
    );
    
    // Step 5: Get current rotated corners using the ORIGINAL frame dimensions
    const currentCenter = calculateRectangleCenter(
      originalBoundingBox.x,
      originalBoundingBox.y,
      originalBoundingBox.width,
      originalBoundingBox.height
    );
    const rotatedCorners = calculateRotatedCorners(
      currentCenter, 
      originalFrameDimensions.width,
      originalFrameDimensions.height, 
      frameRotation
    );
    
    // Step 6: Identify fixed edge and its center
    const oppositeEdge = getOppositeEdge(resizeEdge);
    const fixedEdgeCenter = getFixedEdgeCenter(rotatedCorners, oppositeEdge);
    
    // Step 7: Calculate new frame center
    const newFrameCenter = calculateNewFrameCenter(
      fixedEdgeCenter,
      newDimensions.width,
      newDimensions.height, 
      frameRotation,
      resizeEdge
    );
    
    // Step 8: Calculate new axis-aligned bounding box using the NEW frame dimensions
    const newBoundingBox = calculateAxisAlignedBoundingBox(
      newFrameCenter,
      newDimensions.width,
      newDimensions.height,
      frameRotation
    );
    
    // Step 9: Validate image boundaries (with fixed-edge preservation)
    if (imageWidth < Infinity && imageHeight < Infinity) {
      return validateImageBoundariesWithFixedEdge(
        newBoundingBox,
        fixedEdgeCenter,
        newDimensions,
        frameRotation,
        resizeEdge,
        imageWidth,
        imageHeight
      );
    }
    
    return newBoundingBox;
    
  } catch (error) {
    // Error handling: fall back to original bounding box if anything goes wrong
    console.error('Error in calculateSpatialEdgeFixedResize:', error);
    return originalBoundingBox;
  }
}

/**
 * Calculate the original frame dimensions from a bounding box and rotation
 * This reverses the axis-aligned bounding box calculation to get the original frame size
 * 
 * IMPORTANT: This is a critical fix for the spatial edge-fixed resize algorithm.
 * The issue was that we were using bounding box dimensions as frame dimensions,
 * but for rotated frames, the bounding box is larger than the actual frame.
 * 
 * @param boundingBox - The current axis-aligned bounding box
 * @param rotation - The rotation angle in degrees
 * @returns The original unrotated frame dimensions
 */
function calculateOriginalFrameDimensions(
  boundingBox: BoundingBox,
  rotation: number
): { width: number, height: number } {
  // For 0° rotation, the bounding box dimensions are the frame dimensions
  if (Math.abs(rotation % 360) < 0.01) {
    return { width: boundingBox.width, height: boundingBox.height };
  }
  
  // For rotated frames, we need to solve the inverse bounding box problem:
  // Given: boundingWidth, boundingHeight, rotation
  // Find: originalWidth, originalHeight
  // Such that: calculateAxisAlignedBoundingBox(center, originalWidth, originalHeight, rotation) 
  //           produces boundingWidth × boundingHeight
  
  const angleRad = Math.abs((rotation * Math.PI) / 180);
  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));
  
  // The bounding box calculation is:
  // boundingWidth = originalWidth * cos + originalHeight * sin
  // boundingHeight = originalWidth * sin + originalHeight * cos
  
  // This is a system of 2 equations with 2 unknowns:
  // bw = w*cos + h*sin  ... (1)
  // bh = w*sin + h*cos  ... (2)
  
  // Solving for w and h:
  // From (1): h = (bw - w*cos) / sin
  // Substitute into (2): bh = w*sin + ((bw - w*cos) / sin)*cos
  // Simplify: bh = w*sin + (bw*cos - w*cos²) / sin
  // Multiply by sin: bh*sin = w*sin² + bw*cos - w*cos²
  // Rearrange: bh*sin - bw*cos = w*(sin² - cos²) = -w*cos(2θ)
  // Therefore: w = (bw*cos - bh*sin) / (cos² - sin²) = (bw*cos - bh*sin) / cos(2θ)
  
  const bw = boundingBox.width;
  const bh = boundingBox.height;
  
  // Handle special cases where cos(2θ) ≈ 0 (45°, 135°, etc.)
  const cos2theta = cos * cos - sin * sin;
  
  if (Math.abs(cos2theta) < 0.01) {
    // For 45° rotations, use a different approach
    // At 45°, cos = sin = 1/√2, so:
    // bw = w/√2 + h/√2 = (w + h)/√2
    // bh = w/√2 + h/√2 = (w + h)/√2
    // This means bw = bh and w + h = bw*√2
    
    // We need another constraint. Use the assumption that the original
    // aspect ratio is preserved in some sense.
    // For 45° rotation, we can use: w*h = (bw*bh) / 2
    
    const sum = (bw + bh) / Math.sqrt(2);
    const product = (bw * bh) / 2;
    
    // Solve quadratic: w + h = sum, w*h = product
    // w² - sum*w + product = 0
    const discriminant = sum * sum - 4 * product;
    
    if (discriminant >= 0) {
      const sqrt_discriminant = Math.sqrt(discriminant);
      const w1 = (sum + sqrt_discriminant) / 2;
      const w2 = (sum - sqrt_discriminant) / 2;
      
      // Choose the solution that makes more sense (larger dimension first)
      const originalWidth = Math.max(w1, w2);
      const originalHeight = Math.min(w1, w2);
      
      return { width: originalWidth, height: originalHeight };
    } else {
      // Fallback: assume square
      const avgDim = Math.sqrt(bw * bh);
      return { width: avgDim, height: avgDim };
    }
  }
  
  // General case: solve the linear system
  const originalWidth = (bw * cos - bh * sin) / cos2theta;
  const originalHeight = (bh * cos - bw * sin) / cos2theta;
  
  // Ensure positive dimensions
  const width = Math.abs(originalWidth);
  const height = Math.abs(originalHeight);
  
  // Sanity check: the calculated dimensions should produce the original bounding box
  const verificationBoundingBox = calculateAxisAlignedBoundingBox(
    { x: 0, y: 0 }, width, height, rotation
  );
  
  const widthError = Math.abs(verificationBoundingBox.width - bw);
  const heightError = Math.abs(verificationBoundingBox.height - bh);
  
  // If the error is too large, fall back to a heuristic
  if (widthError > 1 || heightError > 1) {
    // Fallback: use area preservation with aspect ratio from bounding box
    const frameArea = bw * bh * (cos * cos + sin * sin) / (cos + sin);
    const aspectRatio = bw / bh; // Use bounding box aspect ratio as approximation
    
    const fallbackWidth = Math.sqrt(frameArea * aspectRatio);
    const fallbackHeight = Math.sqrt(frameArea / aspectRatio);
    
    return { width: fallbackWidth, height: fallbackHeight };
  }
  
  return { width, height };
} 