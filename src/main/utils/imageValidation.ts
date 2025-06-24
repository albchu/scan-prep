import { AnalysisOptions, ViewportFrame } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import { Point } from './boundaryDetection';

/**
 * Validate click coordinates are within image bounds
 */
export function validateClickCoordinates(
  clickX: number,
  clickY: number,
  imageWidth: number,
  imageHeight: number
): void {
  if (clickX < 0 || clickX >= imageWidth || clickY < 0 || clickY >= imageHeight) {
    throw new Error(
      `Click coordinates (${clickX}, ${clickY}) are outside image bounds (${imageWidth}x${imageHeight})`
    );
  }
}

/**
 * Get background color value based on setting
 */
export function getBackgroundColor(backgroundSetting: 'white' | 'black' | 'auto'): number {
  switch (backgroundSetting) {
    case 'white':
      return 255;
    case 'black':
      return 0;
    case 'auto':
      // TODO: Implement auto-detection of background color
      return 255; // Default to white for now
    default:
      return 255;
  }
}

/**
 * Calculate bounding box from boundary points
 */
export function calculateBoundingBox(
  boundaryPoints: { [key: string]: Point },
  clickX: number,
  clickY: number
): { x: number; y: number; width: number; height: number } {
  const minX = Math.min(
    boundaryPoints['left']?.x ?? clickX,
    boundaryPoints['top-left']?.x ?? clickX,
    boundaryPoints['bottom-left']?.x ?? clickX
  );
  
  const maxX = Math.max(
    boundaryPoints['right']?.x ?? clickX,
    boundaryPoints['top-right']?.x ?? clickX,
    boundaryPoints['bottom-right']?.x ?? clickX
  );
  
  const minY = Math.min(
    boundaryPoints['top']?.y ?? clickY,
    boundaryPoints['top-left']?.y ?? clickY,
    boundaryPoints['top-right']?.y ?? clickY
  );
  
  const maxY = Math.max(
    boundaryPoints['bottom']?.y ?? clickY,
    boundaryPoints['bottom-left']?.y ?? clickY,
    boundaryPoints['bottom-right']?.y ?? clickY
  );

  const width = maxX - minX;
  const height = maxY - minY;

  return { x: minX, y: minY, width, height };
}

/**
 * Create a ViewportFrame from boundary detection results
 */
export function createViewportFrame(
  boundingBox: { x: number; y: number; width: number; height: number },
  options: AnalysisOptions
): ViewportFrame | null {
  // Ensure minimum dimensions
  const width = Math.max(boundingBox.width, options.minDimensionThreshold);
  const height = Math.max(boundingBox.height, options.minDimensionThreshold);
  const area = width * height;

  // Check if detected area meets minimum threshold
  if (area < options.minAreaThreshold) {
    console.log(`Detected area ${area} is below minimum threshold ${options.minAreaThreshold}`);
    return null;
  }

  return {
    id: uuidv4(),
    boundingBox: {
      x: boundingBox.x,
      y: boundingBox.y,
      width,
      height,
    },
    userRotation: 0, // Initial rotation is 0 - user can adjust via UI
    confidence: 1.0, // User-driven detection has high confidence
    area,
  };
} 