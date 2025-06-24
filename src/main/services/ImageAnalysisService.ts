import { Image } from "image-js";
import {
  AnalysisOptions,
  ViewportFrame,
  ViewportFrameResult,
} from "@shared/types";
import { DEFAULT_ANALYSIS_OPTIONS, MAX_FRAME_PREVIEW_DIMENSION } from "@shared/constants";
import {
  detectBoundaryPoints,
  validateClickCoordinates,
  getBackgroundColor,
  calculateBoundingBox,
  createViewportFrame,
} from "../utils";

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
  ): Promise<ViewportFrameResult> {
    const analysisOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };

    try {
      // Load the image
      const image = await Image.load(imagePath);

      console.log("Click-based analysis:", {
        imagePath,
        clickCoordinates: { x: clickX, y: clickY },
        imageDimensions: { width: image.width, height: image.height },
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

      const base64 = await this.generateViewportPreviewInternal(
        image,
        viewportFrame,
      );

      return {
        success: true,
        viewportFrame,
        base64,
      };
    } catch (error) {
      console.error("Error analyzing image with click:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during click analysis",
      };
    }
  }

  /**
   * Detect sub-image boundary using 8-directional traversal from click point
   * Returns axis-aligned bounding box only
   */
  // TODO: Rename this to something about generating frame by basic photo boundary detection
  private async detectSubImageFromClick(
    image: Image,
    clickX: number,
    clickY: number,
    options: AnalysisOptions
  ): Promise<ViewportFrame> {
    console.log("Starting 8-directional boundary detection from click point:", {
      clickX,
      clickY,
    });

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
    return createViewportFrame(boundingBox, options);
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
  ): Promise<ViewportFrameResult> {
    try {
      // Load the source image
      const sourceImage = await Image.load(imagePath);

      // Generate viewport preview with content straightened (counter-rotated)
      const base64 = await this.generateViewportPreviewInternal(
        sourceImage,
        viewportFrame,
      );

      return {
        success: true,
        base64,
        viewportFrame,
      };
    } catch (error) {
      console.error("Error generating viewport preview:", error);
      return {
        success: false,
        viewportFrame,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during viewport preview generation",
      };
    }
  }

  /**
   * Internal method to generate viewport preview with content straightened
   */
  private async generateViewportPreviewInternal(
    sourceImage: Image,
    viewportFrame: ViewportFrame,
  ): Promise<string> {
    // If no rotation, use simple crop and scale
    if (Math.abs(viewportFrame.rotation) < 1) {
      const croppedImage = sourceImage.crop({
        x: Math.round(viewportFrame.boundingBox.x),
        y: Math.round(viewportFrame.boundingBox.y),
        width: Math.round(viewportFrame.boundingBox.width),
        height: Math.round(viewportFrame.boundingBox.height),
      });

      // Refactor notes: I am skeptical about needing this resize. I think we should try without the resize.
      const previewSize = getViewportFramePreviewDimensions(viewportFrame);
      const scaledImage = croppedImage.resize({
        width: previewSize.width,
        height: previewSize.height,
      });

      return scaledImage.toDataURL();
    }

    // Calculate the center of the bounding box in the original image
    const centerX =
      viewportFrame.boundingBox.x + viewportFrame.boundingBox.width / 2;
    const centerY =
      viewportFrame.boundingBox.y + viewportFrame.boundingBox.height / 2;

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
    const cropX = Math.round(
      rotatedCenterX - viewportFrame.boundingBox.width / 2
    );
    const cropY = Math.round(
      rotatedCenterY - viewportFrame.boundingBox.height / 2
    );

    // Crop to the exact bounding box dimensions
    const croppedImage = rotatedImage.crop({
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: Math.min(
        rotatedImage.width - cropX,
        viewportFrame.boundingBox.width
      ),
      height: Math.min(
        rotatedImage.height - cropY,
        viewportFrame.boundingBox.height
      ),
    });

    // Scale to final preview size
    const previewSize = getViewportFramePreviewDimensions(viewportFrame);
    const scaledImage = croppedImage.resize({
      width: previewSize.width,
      height: previewSize.height,
    });

    // Convert to base64
    return scaledImage.toDataURL();
  }
}

const getViewportFramePreviewDimensions = (viewportFrame: ViewportFrame) => {
  const { boundingBox } = viewportFrame;
  const aspectRatio = boundingBox.width / boundingBox.height;

  // Scale to fit within MAX_FRAME_PREVIEW_DIMENSION while preserving aspect ratio
  if (aspectRatio > 1) {
    // Landscape: width is larger
    return {
      width: MAX_FRAME_PREVIEW_DIMENSION,
      height: Math.round(MAX_FRAME_PREVIEW_DIMENSION / aspectRatio),
    };
  } else {
    // Portrait or square: height is larger or equal
    return {
      width: Math.round(MAX_FRAME_PREVIEW_DIMENSION * aspectRatio),
      height: MAX_FRAME_PREVIEW_DIMENSION,
    };
  }
};
