import { Image } from 'image-js';
import {
  AnalysisResult,
  AnalysisOptions,
  DEFAULT_ANALYSIS_OPTIONS,
  DetectedSubImage,
  ViewportPreviewResult,
  BoundingBox,
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

  /**
   * Generate viewport preview for a detected region
   * @param imagePath - Source image path
   * @param detection - Detection with rotation information
   * @param previewSize - Target size for the preview (e.g., 200x200)
   * @returns Base64 encoded viewport preview
   */
  async generateViewportPreview(
    imagePath: string, 
    detection: DetectedSubImage,
    previewSize: { width: number; height: number }
  ): Promise<ViewportPreviewResult> {
    try {
      console.log('Generating viewport preview for detection:', detection.id, 'with rotation:', detection.userRotation);
      
      // Load the source image
      const sourceImage = await Image.load(imagePath);
      
      // Generate viewport preview with content straightened (counter-rotated)
      const base64 = await this.generateViewportPreviewInternal(
        sourceImage,
        detection,
        previewSize
      );
      
      return {
        success: true,
        id: detection.id,
        base64,
        width: previewSize.width,
        height: previewSize.height,
        originalDetection: detection,
      };
    } catch (error) {
      console.error('Error generating viewport preview:', error);
      return {
        success: false,
        id: detection.id,
        originalDetection: detection,
        error: error instanceof Error ? error.message : 'Unknown error during viewport preview generation',
      };
    }
  }

  /**
   * Internal method to generate viewport preview with content straightened
   */
  private async generateViewportPreviewInternal(
    sourceImage: Image,
    detection: DetectedSubImage,
    previewSize: { width: number; height: number }
  ): Promise<string> {
    // If no rotation, use simple crop and scale
    if (Math.abs(detection.userRotation) < 1) {
      const croppedImage = sourceImage.crop({
        x: Math.round(detection.boundingBox.x),
        y: Math.round(detection.boundingBox.y),
        width: Math.round(detection.boundingBox.width),
        height: Math.round(detection.boundingBox.height)
      });
      
      const scaledImage = croppedImage.resize({
        width: previewSize.width,
        height: previewSize.height
      });
      
      return scaledImage.toDataURL();
    }
    
    // Calculate the center of the bounding box in the original image
    const centerX = detection.boundingBox.x + detection.boundingBox.width / 2;
    const centerY = detection.boundingBox.y + detection.boundingBox.height / 2;
    
    // Rotate the entire image (negative angle to straighten content)
    // Note: the image-js library rotates around the center of the image
    const rotatedImage = sourceImage.rotate(-detection.userRotation);
    
    // Calculate the transformation from original to rotated coordinates
    // The rotation center in the original image is sourceImage.width/2, sourceImage.height/2
    // After rotation, this point becomes rotatedImage.width/2, rotatedImage.height/2
    
    // Calculate the vector from image center to bounding box center in the original image
    const vectorX = centerX - sourceImage.width / 2;
    const vectorY = centerY - sourceImage.height / 2;
    
    // Calculate the angle in radians for the rotation
    const angleRad = (-detection.userRotation * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    
    // Rotate this vector to find where the bounding box center is in the rotated image
    const rotatedVectorX = vectorX * cosAngle - vectorY * sinAngle;
    const rotatedVectorY = vectorX * sinAngle + vectorY * cosAngle;
    
    // Calculate the new center position in the rotated image
    const rotatedCenterX = rotatedImage.width / 2 + rotatedVectorX;
    const rotatedCenterY = rotatedImage.height / 2 + rotatedVectorY;
    
    // Calculate crop coordinates (centered on the rotated box center)
    const cropX = Math.round(rotatedCenterX - detection.boundingBox.width / 2);
    const cropY = Math.round(rotatedCenterY - detection.boundingBox.height / 2);
    
    // Crop to the exact bounding box dimensions
    const croppedImage = rotatedImage.crop({
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(rotatedImage.width - cropX, detection.boundingBox.width),
      height: Math.min(rotatedImage.height - cropY, detection.boundingBox.height)
    });
    
    // Scale to final preview size
    const scaledImage = croppedImage.resize({
      width: previewSize.width,
      height: previewSize.height
    });
    
    // Convert to base64
    return scaledImage.toDataURL();
  }

  /**
   * Calculate rotated corner coordinates
   */
  private calculateRotatedCorners(
    boundingBox: BoundingBox, 
    rotationDegrees: number
  ): { x: number; y: number }[] {
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    const angleRad = (rotationDegrees * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    const halfWidth = boundingBox.width / 2;
    const halfHeight = boundingBox.height / 2;
    
    return [
      { x: -halfWidth, y: -halfHeight }, // Top-left
      { x: halfWidth, y: -halfHeight },  // Top-right
      { x: halfWidth, y: halfHeight },   // Bottom-right
      { x: -halfWidth, y: halfHeight },  // Bottom-left
    ].map(corner => ({
      x: centerX + corner.x * cos - corner.y * sin,
      y: centerY + corner.x * sin + corner.y * cos,
    }));
  }

  /**
   * Calculate expanded region that encompasses the rotated overlay frame
   */
  private calculateExpandedRegion(
    boundingBox: BoundingBox, 
    rotationDegrees: number,
    imageWidth: number,
    imageHeight: number
  ): BoundingBox {
    // Get the rotated corners of the overlay frame
    const corners = this.calculateRotatedCorners(boundingBox, rotationDegrees);
    
    // Find the minimum bounding rectangle that contains all corners
    const minX = Math.max(0, Math.min(...corners.map(c => c.x)));
    const minY = Math.max(0, Math.min(...corners.map(c => c.y)));
    const maxX = Math.min(imageWidth, Math.max(...corners.map(c => c.x)));
    const maxY = Math.min(imageHeight, Math.max(...corners.map(c => c.y)));
    
    // Add padding to ensure we capture enough content for rotation
    // Increase padding for larger rotation angles
    const rotationFactor = Math.min(1, Math.abs(rotationDegrees) / 90);
    const basePadding = Math.max(boundingBox.width, boundingBox.height) * 0.2;
    const padding = basePadding * (1 + rotationFactor);
    
    return {
      x: Math.round(Math.max(0, minX - padding)),
      y: Math.round(Math.max(0, minY - padding)),
      width: Math.round(Math.min(imageWidth, maxX + padding) - Math.max(0, minX - padding)),
      height: Math.round(Math.min(imageHeight, maxY + padding) - Math.max(0, minY - padding))
    };
  }
} 