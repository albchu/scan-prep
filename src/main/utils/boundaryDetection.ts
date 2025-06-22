import { Image } from 'image-js';

/**
 * Direction vector for 8-directional traversal
 */
export interface Direction {
  name: string;
  dx: number;
  dy: number;
}

/**
 * Point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * The 8 traverse directions for boundary detection
 */
export const TRAVERSE_DIRECTIONS: Direction[] = [
  { name: 'top', dx: 0, dy: -1 },
  { name: 'bottom', dx: 0, dy: 1 },
  { name: 'left', dx: -1, dy: 0 },
  { name: 'right', dx: 1, dy: 0 },
  { name: 'top-left', dx: -1, dy: -1 },
  { name: 'top-right', dx: 1, dy: -1 },
  { name: 'bottom-left', dx: -1, dy: 1 },
  { name: 'bottom-right', dx: 1, dy: 1 }
];

/**
 * Get image edge coordinates for a given direction
 */
export function getImageEdge(
  imageWidth: number,
  imageHeight: number,
  clickX: number,
  clickY: number,
  dx: number,
  dy: number
): Point {
  if (dx < 0) return { x: 0, y: clickY }; // Left edge
  if (dx > 0) return { x: imageWidth - 1, y: clickY }; // Right edge
  if (dy < 0) return { x: clickX, y: 0 }; // Top edge
  if (dy > 0) return { x: clickX, y: imageHeight - 1 }; // Bottom edge
  
  // Diagonal directions - find the appropriate corner
  if (dx < 0 && dy < 0) return { x: 0, y: 0 }; // Top-left corner
  if (dx > 0 && dy < 0) return { x: imageWidth - 1, y: 0 }; // Top-right corner
  if (dx < 0 && dy > 0) return { x: 0, y: imageHeight - 1 }; // Bottom-left corner
  if (dx > 0 && dy > 0) return { x: imageWidth - 1, y: imageHeight - 1 }; // Bottom-right corner
  
  return { x: clickX, y: clickY }; // Fallback
}

/**
 * Traverse in a specific direction to find background boundary
 */
export function traverseDirection(
  grayImage: Image,
  startX: number,
  startY: number,
  dx: number,
  dy: number,
  backgroundColor: number,
  tolerance: number = 30,
  stepSize: number = 2
): Point | null {
  const width = grayImage.width;
  const height = grayImage.height;
  
  let x = startX;
  let y = startY;
  
  // Traverse outwards in the given direction
  while (x >= 0 && x < width && y >= 0 && y < height) {
    // Move to next position
    x += dx * stepSize;
    y += dy * stepSize;
    
    // Check if we're still within bounds
    if (x < 0 || x >= width || y < 0 || y >= height) {
      break;
    }
    
    // Sample a small region around the current point for better detection
    const sampleSize = 3;
    let backgroundPixelCount = 0;
    let totalPixels = 0;
    
    for (let sy = Math.max(0, y - sampleSize); sy <= Math.min(height - 1, y + sampleSize); sy++) {
      for (let sx = Math.max(0, x - sampleSize); sx <= Math.min(width - 1, x + sampleSize); sx++) {
        const pixelValue = grayImage.getPixelXY(sx, sy)[0];
        totalPixels++;
        
        if (Math.abs(pixelValue - backgroundColor) <= tolerance) {
          backgroundPixelCount++;
        }
      }
    }
    
    // If most pixels in the sample are background, we found the boundary
    const backgroundRatio = backgroundPixelCount / totalPixels;
    if (backgroundRatio > 0.7) { // 70% of pixels must be background
      return { x, y };
    }
  }
  
  return null; // No boundary found within image bounds
}

/**
 * Detect boundary points in all 8 directions from a click point
 */
export function detectBoundaryPoints(
  grayImage: Image,
  clickX: number,
  clickY: number,
  backgroundColor: number,
  tolerance: number = 30
): { [key: string]: Point } {
  const boundaryPoints: { [key: string]: Point } = {};
  
  for (const direction of TRAVERSE_DIRECTIONS) {
    const boundaryPoint = traverseDirection(
      grayImage,
      clickX,
      clickY,
      direction.dx,
      direction.dy,
      backgroundColor,
      tolerance
    );
    
    if (boundaryPoint) {
      boundaryPoints[direction.name] = boundaryPoint;
      console.log(`Found ${direction.name} boundary at:`, boundaryPoint);
    } else {
      console.log(`No ${direction.name} boundary found, using image edge`);
      // Use image edges as fallback
      boundaryPoints[direction.name] = getImageEdge(
        grayImage.width,
        grayImage.height,
        clickX,
        clickY,
        direction.dx,
        direction.dy
      );
    }
  }
  
  return boundaryPoints;
} 