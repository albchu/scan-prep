import { Image } from 'image-js';
import {
  AnalysisResult,
  AnalysisOptions,
  DEFAULT_ANALYSIS_OPTIONS,
  ViewportFrame,
  ViewportPreviewResult,
} from '@shared/types';
import {
  detectBoundaryPoints,
  validateClickCoordinates,
  getBackgroundColor,
  calculateBoundingBox,
  createViewportFrame,
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
      const viewportFrame = await this.detectSubImageFromClick(
        image, 
        clickX, 
        clickY, 
        analysisOptions
      );
      
      const analysisTime = Date.now() - startTime;
      
      return {
        success: true,
        detectedImages: viewportFrame ? [viewportFrame] : [],
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
  ): Promise<ViewportFrame | null> {
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
    
    // Create viewport frame (axis-aligned only)
    const viewportFrame = createViewportFrame(boundingBox, options);

    if (!viewportFrame) {
      return null;
    }

    console.log('Detected viewport frame from click:', {
      boundingBox: viewportFrame.boundingBox,
      area: viewportFrame.area,
      clickPoint: { x: clickX, y: clickY }
    });

    // Save debug image if enabled
    if (isDebugMode()) {
      await saveDebugImage(gray, viewportFrame, clickX, clickY);
    }

    return viewportFrame;
  }

  /**
   * Generate viewport preview for a detected region
   * @param imagePath - Source image path
   * @param viewportFrame - ViewportFrame with rotation information
   * @param previewSize - Target size for the preview (e.g., 200x200)
   * @returns Base64 encoded viewport preview
   */
  async generateViewportPreview(
    imagePath: string, 
    viewportFrame: ViewportFrame,
    previewSize: { width: number; height: number }
  ): Promise<ViewportPreviewResult> {
    try {
      // Load the source image
      const sourceImage = await Image.load(imagePath);
      
      // Generate viewport preview with content straightened (counter-rotated)
      const base64 = await this.generateViewportPreviewInternal(
        sourceImage,
        viewportFrame,
        previewSize
      );
      
      return {
        success: true,
        id: viewportFrame.id,
        base64,
        width: previewSize.width,
        height: previewSize.height,
        viewportFrame,
      };
    } catch (error) {
      console.error('Error generating viewport preview:', error);
      return {
        success: false,
        id: viewportFrame.id,
        viewportFrame,
        error: error instanceof Error ? error.message : 'Unknown error during viewport preview generation',
      };
    }
  }

  /**
   * Internal method to generate viewport preview with content straightened
   */
  private async generateViewportPreviewInternal(
    sourceImage: Image,
    viewportFrame: ViewportFrame,
    previewSize: { width: number; height: number }
  ): Promise<string> {
    // If no rotation, use simple crop and scale
    if (Math.abs(viewportFrame.rotation) < 1) {
      const croppedImage = sourceImage.crop({
        x: Math.round(viewportFrame.boundingBox.x),
        y: Math.round(viewportFrame.boundingBox.y),
        width: Math.round(viewportFrame.boundingBox.width),
        height: Math.round(viewportFrame.boundingBox.height)
      });
      
      const scaledImage = croppedImage.resize({
        width: previewSize.width,
        height: previewSize.height
      });
      
      return scaledImage.toDataURL();
    }
    
    // Calculate the center of the bounding box in the original image
    const centerX = viewportFrame.boundingBox.x + viewportFrame.boundingBox.width / 2;
    const centerY = viewportFrame.boundingBox.y + viewportFrame.boundingBox.height / 2;
    
    // Rotate the entire image (negative angle to straighten content)
    // Note: the image-js library rotates around the center of the image
    const rotatedImage = sourceImage.rotate(-viewportFrame.rotation);
    
    // Calculate the transformation from original to rotated coordinates
    // The rotation center in the original image is sourceImage.width/2, sourceImage.height/2
    // After rotation, this point becomes rotatedImage.width/2, rotatedImage.height/2
    
    // Calculate the vector from image center to bounding box center in the original image
    const vectorX = centerX - sourceImage.width / 2;
    const vectorY = centerY - sourceImage.height / 2;
    
    // Calculate the angle in radians for the rotation
    const angleRad = (-viewportFrame.rotation * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    
    // Rotate this vector to find where the bounding box center is in the rotated image
    const rotatedVectorX = vectorX * cosAngle - vectorY * sinAngle;
    const rotatedVectorY = vectorX * sinAngle + vectorY * cosAngle;
    
    // Calculate the new center position in the rotated image
    const rotatedCenterX = rotatedImage.width / 2 + rotatedVectorX;
    const rotatedCenterY = rotatedImage.height / 2 + rotatedVectorY;
    
    // Calculate crop coordinates (centered on the rotated box center)
    const cropX = Math.round(rotatedCenterX - viewportFrame.boundingBox.width / 2);
    const cropY = Math.round(rotatedCenterY - viewportFrame.boundingBox.height / 2);
    
    // Crop to the exact bounding box dimensions
    const croppedImage = rotatedImage.crop({
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(rotatedImage.width - cropX, viewportFrame.boundingBox.width),
      height: Math.min(rotatedImage.height - cropY, viewportFrame.boundingBox.height)
    });
    
    // Scale to final preview size
    const scaledImage = croppedImage.resize({
      width: previewSize.width,
      height: previewSize.height
    });
    
    // Convert to base64
    return scaledImage.toDataURL();
  }
} 