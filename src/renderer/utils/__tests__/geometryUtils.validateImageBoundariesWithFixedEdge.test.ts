import { 
  validateImageBoundariesWithFixedEdge,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  getOppositeEdge,
  calculateRectangleCenter
} from "../geometryUtils";
import { FrameEdge } from "@shared/types";

describe("validateImageBoundariesWithFixedEdge", () => {
  const imageWidth = 1000;
  const imageHeight = 800;

  it("should return the same bounding box if it's within image boundaries", () => {
    const boundingBox = { x: 100, y: 100, width: 200, height: 150 };
    const fixedEdgeCenter = { x: 200, y: 100 }; // top edge center
    const frameDimensions = { width: 200, height: 150 };
    const frameRotation = 0;
    const resizeEdge = 'bottom';

    const result = validateImageBoundariesWithFixedEdge(
      boundingBox,
      fixedEdgeCenter,
      frameDimensions,
      frameRotation,
      resizeEdge,
      imageWidth,
      imageHeight
    );

    expect(result).toEqual(boundingBox);
  });

  it("should constrain bounding box when it exceeds image boundaries", () => {
    const boundingBox = { x: -50, y: -30, width: 300, height: 200 };
    const fixedEdgeCenter = { x: 100, y: -30 }; // top edge center (outside image)
    const frameDimensions = { width: 300, height: 200 };
    const frameRotation = 0;
    const resizeEdge = 'bottom';

    const result = validateImageBoundariesWithFixedEdge(
      boundingBox,
      fixedEdgeCenter,
      frameDimensions,
      frameRotation,
      resizeEdge,
      imageWidth,
      imageHeight
    );

    // Result should be within image boundaries
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
    expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
  });

  it("should handle rotated frames correctly", () => {
    // Create a rotated frame that exceeds boundaries
    const originalCenter = { x: 950, y: 400 }; // Near right edge
    const frameWidth = 200;
    const frameHeight = 100;
    const frameRotation = 45;

    // Calculate rotated corners and bounding box
    const rotatedCorners = calculateRotatedCorners(
      originalCenter,
      frameWidth,
      frameHeight,
      frameRotation
    );

    // Create a bounding box that likely exceeds image boundaries
    const minX = Math.min(...rotatedCorners.map(c => c.x));
    const maxX = Math.max(...rotatedCorners.map(c => c.x));
    const minY = Math.min(...rotatedCorners.map(c => c.y));
    const maxY = Math.max(...rotatedCorners.map(c => c.y));

    const boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    const resizeEdge = 'right';
    const oppositeEdge = getOppositeEdge(resizeEdge);
    const fixedEdgeCenter = getFixedEdgeCenter(rotatedCorners, oppositeEdge);
    const frameDimensions = { width: frameWidth, height: frameHeight };

    const result = validateImageBoundariesWithFixedEdge(
      boundingBox,
      fixedEdgeCenter,
      frameDimensions,
      frameRotation,
      resizeEdge,
      imageWidth,
      imageHeight
    );

    // Result should be within image boundaries
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
    expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
  });

  it("should handle edge cases with very small images", () => {
    const smallImageWidth = 100;
    const smallImageHeight = 80;
    const boundingBox = { x: 50, y: 40, width: 200, height: 150 }; // Much larger than image
    const fixedEdgeCenter = { x: 150, y: 40 }; // top edge center
    const frameDimensions = { width: 200, height: 150 };
    const frameRotation = 0;
    const resizeEdge = 'bottom';

    const result = validateImageBoundariesWithFixedEdge(
      boundingBox,
      fixedEdgeCenter,
      frameDimensions,
      frameRotation,
      resizeEdge,
      smallImageWidth,
      smallImageHeight
    );

    // Result should fit within small image
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.x + result.width).toBeLessThanOrEqual(smallImageWidth);
    expect(result.y + result.height).toBeLessThanOrEqual(smallImageHeight);
  });

  it("should handle different resize edges correctly", () => {
    const boundingBox = { x: 950, y: 400, width: 100, height: 100 }; // Near right edge
    const originalCenter = calculateRectangleCenter(
      boundingBox.x,
      boundingBox.y,
      boundingBox.width,
      boundingBox.height
    );
    const rotatedCorners = calculateRotatedCorners(
      originalCenter,
      boundingBox.width,
      boundingBox.height,
      0 // No rotation for simplicity
    );

    const testCases: Array<{ resizeEdge: FrameEdge, oppositeEdge: FrameEdge }> = [
      { resizeEdge: 'top', oppositeEdge: 'bottom' },
      { resizeEdge: 'right', oppositeEdge: 'left' },
      { resizeEdge: 'bottom', oppositeEdge: 'top' },
      { resizeEdge: 'left', oppositeEdge: 'right' },
    ];

    testCases.forEach(({ resizeEdge, oppositeEdge }) => {
      const fixedEdgeCenter = getFixedEdgeCenter(rotatedCorners, oppositeEdge);
      const frameDimensions = { width: boundingBox.width, height: boundingBox.height };

      const result = validateImageBoundariesWithFixedEdge(
        boundingBox,
        fixedEdgeCenter,
        frameDimensions,
        0, // No rotation
        resizeEdge,
        imageWidth,
        imageHeight
      );

      // Result should be within image boundaries
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
    });
  });

  it("should handle zero-sized frames gracefully", () => {
    const boundingBox = { x: 500, y: 400, width: 0, height: 0 };
    const fixedEdgeCenter = { x: 500, y: 400 };
    const frameDimensions = { width: 0, height: 0 };
    const frameRotation = 0;
    const resizeEdge = 'right';

    const result = validateImageBoundariesWithFixedEdge(
      boundingBox,
      fixedEdgeCenter,
      frameDimensions,
      frameRotation,
      resizeEdge,
      imageWidth,
      imageHeight
    );

    // Should return a valid bounding box
    expect(result.x).toBeGreaterThanOrEqual(0);
    expect(result.y).toBeGreaterThanOrEqual(0);
    expect(result.width).toBeGreaterThanOrEqual(0);
    expect(result.height).toBeGreaterThanOrEqual(0);
  });
}); 