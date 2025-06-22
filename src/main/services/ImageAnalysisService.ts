import { Image } from 'image-js';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisResult,
  AnalysisOptions,
  DEFAULT_ANALYSIS_OPTIONS,
  DetectedSubImage,
} from '@shared/types';

export class ImageAnalysisService {
  // Debug mode flag
  private readonly DEBUG_MODE = process.env.DEBUG_MASKS === 'true' || process.env.NODE_ENV === 'development';





  /**
   * Analyze an image with a user click point to detect a sub-image boundary
   */
  async analyzeImageWithClick(
    imagePath: string,
    clickX: number,
    clickY: number,
    options: Partial<AnalysisOptions> = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };

    try {
      // Load the image
      const image = await Image.load(imagePath);
      
      console.log('Click-based analysis:', {
        imagePath,
        clickCoordinates: { x: clickX, y: clickY },
        imageDimensions: { width: image.width, height: image.height }
      });

      // Validate click coordinates
      if (clickX < 0 || clickX >= image.width || clickY < 0 || clickY >= image.height) {
        throw new Error(`Click coordinates (${clickX}, ${clickY}) are outside image bounds (${image.width}x${image.height})`);
      }
      
      // Detect sub-image boundary using 8-directional traversal
      const detectedImage = await this.detectSubImageFromClick(image, clickX, clickY, analysisOptions);
      
      const analysisTime = Date.now() - startTime;
      
      return {
        success: true,
        detectedImages: detectedImage ? [detectedImage] : [],
        analysisTime,
        imageWidth: image.width,
        imageHeight: image.height,
      };
    } catch (error) {
      console.error('Error analyzing image with click:', error);
      return {
        success: false,
        detectedImages: [],
        analysisTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error during click analysis',
        imageWidth: 0,
        imageHeight: 0,
      };
    }
  }

  /**
   * Detect sub-image boundary using 8-directional traversal from click point
   */
  private async detectSubImageFromClick(
    image: Image,
    clickX: number,
    clickY: number,
    options: AnalysisOptions
  ): Promise<DetectedSubImage | null> {
    console.log('Starting 8-directional boundary detection from click point:', { clickX, clickY });
    
    // Convert to grayscale for analysis
    const gray = image.grey();
    
    // Define the 8 traverse directions
    const directions = [
      { name: 'top', dx: 0, dy: -1 },
      { name: 'bottom', dx: 0, dy: 1 },
      { name: 'left', dx: -1, dy: 0 },
      { name: 'right', dx: 1, dy: 0 },
      { name: 'top-left', dx: -1, dy: -1 },
      { name: 'top-right', dx: 1, dy: -1 },
      { name: 'bottom-left', dx: -1, dy: 1 },
      { name: 'bottom-right', dx: 1, dy: 1 }
    ];

    // Get background color (assuming white scanner background)
    const backgroundColor = this.getBackgroundColor(options.backgroundColor);
    const tolerance = 30; // Tolerance for color matching
    
    // Find boundary points in each direction
    const boundaryPoints: { [key: string]: { x: number, y: number } } = {};
    
    for (const direction of directions) {
      const boundaryPoint = this.traverseDirection(
        gray, 
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
        boundaryPoints[direction.name] = this.getImageEdge(image, clickX, clickY, direction.dx, direction.dy);
      }
    }

    // Calculate bounding box from boundary points
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

    // Ensure minimum dimensions
    const width = Math.max(maxX - minX, options.minDimensionThreshold);
    const height = Math.max(maxY - minY, options.minDimensionThreshold);
    const area = width * height;

    // Check if detected area meets minimum threshold
    if (area < options.minAreaThreshold) {
      console.log(`Detected area ${area} is below minimum threshold ${options.minAreaThreshold}`);
      return null;
    }

    const detectedImage: DetectedSubImage = {
      id: uuidv4(),
      boundingBox: {
        x: minX,
        y: minY,
        width,
        height,
      },
      confidence: 1.0, // User-driven detection has high confidence
      area,
    };

    console.log('Detected sub-image from click:', {
      boundingBox: detectedImage.boundingBox,
      area: detectedImage.area,
      clickPoint: { x: clickX, y: clickY }
    });

    // Save debug image if enabled
    if (this.DEBUG_MODE) {
      await this.saveDebugImage(gray, detectedImage, clickX, clickY);
    }

    return detectedImage;
  }

  /**
   * Traverse in a specific direction to find background boundary
   */
  private traverseDirection(
    grayImage: Image,
    startX: number,
    startY: number,
    dx: number,
    dy: number,
    backgroundColor: number,
    tolerance: number,
    stepSize: number = 2
  ): { x: number, y: number } | null {
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
   * Get background color value based on setting
   */
  private getBackgroundColor(backgroundSetting: 'white' | 'black' | 'auto'): number {
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
   * Get image edge coordinates for a given direction
   */
  private getImageEdge(
    image: Image,
    clickX: number,
    clickY: number,
    dx: number,
    dy: number
  ): { x: number, y: number } {
    if (dx < 0) return { x: 0, y: clickY }; // Left edge
    if (dx > 0) return { x: image.width - 1, y: clickY }; // Right edge
    if (dy < 0) return { x: clickX, y: 0 }; // Top edge
    if (dy > 0) return { x: clickX, y: image.height - 1 }; // Bottom edge
    
    // Diagonal directions - find the appropriate corner
    if (dx < 0 && dy < 0) return { x: 0, y: 0 }; // Top-left corner
    if (dx > 0 && dy < 0) return { x: image.width - 1, y: 0 }; // Top-right corner
    if (dx < 0 && dy > 0) return { x: 0, y: image.height - 1 }; // Bottom-left corner
    if (dx > 0 && dy > 0) return { x: image.width - 1, y: image.height - 1 }; // Bottom-right corner
    
    return { x: clickX, y: clickY }; // Fallback
  }

  /**
   * Save debug image with detected boundary and click point
   */
  private async saveDebugImage(
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
} 