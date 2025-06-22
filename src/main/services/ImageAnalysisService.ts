import { Image } from 'image-js';
import {
  AnalysisResult,
  AnalysisOptions,
  DEFAULT_ANALYSIS_OPTIONS,
  DetectedSubImage,
} from '@shared/types';
import {
  detectBoundaryPoints,
  validateClickCoordinates,
  getBackgroundColor,
  calculateBoundingBox,
  createDetectedSubImage,
  isDebugMode,
  saveDebugImage,
} from '../utils';

export class ImageAnalysisService {
  /**
   * Analyze an image with a user click point to detect a sub-image boundary
   * Returns axis-aligned rectangles only - rotation is handled by UI
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
      validateClickCoordinates(clickX, clickY, image.width, image.height);
      
      // Detect sub-image boundary using 8-directional traversal
      const detectedImage = await this.detectSubImageFromClick(
        image, 
        clickX, 
        clickY, 
        analysisOptions
      );
      
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
   * Returns axis-aligned bounding box only
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
    
    // Get background color and detect boundary points
    const backgroundColor = getBackgroundColor(options.backgroundColor);
    const tolerance = 30; // Tolerance for color matching
    
    const boundaryPoints = detectBoundaryPoints(
      gray,
      clickX,
      clickY,
      backgroundColor,
      tolerance
    );

    // Calculate axis-aligned bounding box from boundary points
    const boundingBox = calculateBoundingBox(boundaryPoints, clickX, clickY);
    
    // Create detected sub-image (axis-aligned only)
    const detectedImage = createDetectedSubImage(boundingBox, options);

    if (!detectedImage) {
      return null;
    }

    console.log('Detected sub-image from click:', {
      boundingBox: detectedImage.boundingBox,
      area: detectedImage.area,
      clickPoint: { x: clickX, y: clickY }
    });

    // Save debug image if enabled
    if (isDebugMode()) {
      await saveDebugImage(gray, detectedImage, clickX, clickY);
    }

    return detectedImage;
  }
} 