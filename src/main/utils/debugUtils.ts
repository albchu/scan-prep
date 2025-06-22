import { Image } from 'image-js';
import { DetectedSubImage } from '@shared/types';

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return process.env.DEBUG_MASKS === 'true' || process.env.NODE_ENV === 'development';
}

/**
 * Save debug image with detected boundary and click point
 */
export async function saveDebugImage(
  grayImage: Image,
  detection: DetectedSubImage,
  clickX: number,
  clickY: number
): Promise<void> {
  try {
    // Create a copy for debugging
    const debugImage = grayImage.clone();
    
    // Draw bounding box (we'll simulate this by creating a simple overlay)
    // Note: image-js doesn't have direct drawing capabilities, so we'll just save the info
    console.log('Debug image info:', {
      detectedBoundingBox: detection.boundingBox,
      clickPoint: { x: clickX, y: clickY },
      savedTo: './debug/click_detection.png'
    });
    
    await debugImage.save('./debug/click_detection.png');
  } catch (error) {
    console.error('Error saving debug image:', error);
  }
} 