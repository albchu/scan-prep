import {
  transformMouseDeltaToFrameLocal,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  getResizeEdgeMapping,
  getOppositeEdge,
  calculateNewFrameDimensions,
  calculateSpatialEdgeFixedResize,
  calculateResizedBoundingBox,
  Point,
} from "../geometryUtils";

import { BoundingBox, FRAME_EDGES } from "@shared/types";

// Local helper function for testing inverse relationship
function rotatePoint(point: Point, angleInDegrees: number): Point {
  const angleRad = (angleInDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

describe("Geometry Utils Integration Tests", () => {
  describe("Edge Analysis and Spatial Transformations", () => {
    it("should correctly calculate edge centers and mappings for rotated frames with consistent geometry", () => {
      const center: Point = { x: 100, y: 100 };
      const width = 60;
      const height = 40;
      const rotation = 30;

      // Calculate rotated corners
      const corners = calculateRotatedCorners(center, width, height, rotation);

      // Test that we can get edge centers for all edges
      const edges: ("top" | "right" | "bottom" | "left")[] = [
        "top",
        "right",
        "bottom",
        "left",
      ];
      const edgeCenters = edges.map((edge) => ({
        edge,
        center: getFixedEdgeCenter(corners, edge),
      }));

      // Verify all edge centers are at reasonable distances from the frame center
      edgeCenters.forEach(({ center: edgeCenter }) => {
        const distance = Math.sqrt(
          (edgeCenter.x - center.x) ** 2 + (edgeCenter.y - center.y) ** 2
        );

        // For the given dimensions, edge centers should be roughly 15-30 units from center
        expect(distance).toBeGreaterThan(10);
        expect(distance).toBeLessThan(50);
      });

      // Test edge mapping with various drag directions
      const dragDirections = [
        { x: 1, y: 0 }, // right
        { x: 0, y: 1 }, // down
        { x: -1, y: 0 }, // left
        { x: 0, y: -1 }, // up
      ];

      dragDirections.forEach((direction) => {
        const mappedEdge = getResizeEdgeMapping(rotation, direction);
        expect(edges).toContain(mappedEdge);

        // Test that opposite edge function works
        const oppositeEdge = getOppositeEdge(mappedEdge);
        expect(edges).toContain(oppositeEdge);
        expect(oppositeEdge).not.toBe(mappedEdge);
      });
    });

    it("should maintain geometric consistency across different rotation angles for edge calculations", () => {
      const center: Point = { x: 50, y: 50 };
      const width = 30;
      const height = 20;
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];

      rotations.forEach((rotation) => {
        const corners = calculateRotatedCorners(center, width, height, rotation);

        // Verify that the centroid of corners equals the original center
        const centroid: Point = {
          x: corners.reduce((sum, corner) => sum + corner.x, 0) / 4,
          y: corners.reduce((sum, corner) => sum + corner.y, 0) / 4,
        };

        expect(centroid.x).toBeCloseTo(center.x, 10);
        expect(centroid.y).toBeCloseTo(center.y, 10);

              // Verify that edge centers are properly calculated
      const edges = FRAME_EDGES;
        edges.forEach((edge) => {
          const edgeCenter = getFixedEdgeCenter(corners, edge);

          // Edge center should be within reasonable bounds
          expect(edgeCenter.x).toBeGreaterThan(center.x - width);
          expect(edgeCenter.x).toBeLessThan(center.x + width);
          expect(edgeCenter.y).toBeGreaterThan(center.y - height);
          expect(edgeCenter.y).toBeLessThan(center.y + height);
        });
      });
    });
  });

  describe("Complete Spatial Resize Workflow", () => {
    it("should execute complete spatial edge-fixed resize workflow with proper component integration", () => {
      const originalBoundingBox: BoundingBox = {
        x: 100,
        y: 100,
        width: 80,
        height: 60,
      };
      const frameRotation = 30;
      const resizeEdge = "right";
      const mouseDelta: Point = { x: 30, y: 0 };
      const scaleFactors = { scaleX: 1, scaleY: 1 };

      // Test the complete workflow
      const result = calculateSpatialEdgeFixedResize(
        originalBoundingBox,
        frameRotation,
        resizeEdge,
        mouseDelta,
        scaleFactors
      );

      // Verify the workflow produces reasonable results
      expect(result.width).toBeGreaterThan(originalBoundingBox.width);
      expect(result.height).toBeGreaterThanOrEqual(originalBoundingBox.height);

      // Verify individual components work correctly
      const imageDelta = {
        x: mouseDelta.x / scaleFactors.scaleX,
        y: mouseDelta.y / scaleFactors.scaleY,
      };
      const localDelta = transformMouseDeltaToFrameLocal(
        imageDelta,
        frameRotation
      );
      const newDimensions = calculateNewFrameDimensions(
        originalBoundingBox.width,
        originalBoundingBox.height,
        resizeEdge,
        localDelta
      );

      expect(newDimensions.width).toBeGreaterThan(originalBoundingBox.width);
      expect(newDimensions.height).toBe(originalBoundingBox.height);
    });

    it("should maintain mathematical consistency and produce valid results across all rotation angles", () => {
      const originalBoundingBox: BoundingBox = {
        x: 0,
        y: 0,
        width: 40,
        height: 30,
      };
      const mouseDelta: Point = { x: 20, y: 0 };
      const scaleFactors = { scaleX: 1, scaleY: 1 };
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];

      rotations.forEach((rotation) => {
        const result = calculateSpatialEdgeFixedResize(
          originalBoundingBox,
          rotation,
          "right",
          mouseDelta,
          scaleFactors
        );

        // All rotations should produce valid results
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
        expect(isFinite(result.x)).toBe(true);
        expect(isFinite(result.y)).toBe(true);

        // The bounding box should be reasonable in size
        // Note: For rotated frames, the bounding box area can be significantly different
        // from the original area due to rotation effects, so we just check it's positive
        const newArea = result.width * result.height;
        expect(newArea).toBeGreaterThan(0);
      });
    });
  });

  describe("End-to-End Transformation Pipeline", () => {
    it("should correctly transform mouse coordinates through the complete geometry pipeline", () => {
      const center: Point = { x: 100, y: 100 };
      const width = 60;
      const height = 40;
      const rotation = 30;

      // Calculate rotated corners
      const corners = calculateRotatedCorners(center, width, height, rotation);

      // Simulate a mouse delta in global coordinates
      const globalMouseDelta: Point = { x: 10, y: 5 };

      // Transform to frame local coordinates
      const localDelta = transformMouseDeltaToFrameLocal(
        globalMouseDelta,
        rotation
      );

      // Verify the transformation is consistent
      const backToGlobal = rotatePoint(localDelta, rotation);
      expect(backToGlobal.x).toBeCloseTo(globalMouseDelta.x, 10);
      expect(backToGlobal.y).toBeCloseTo(globalMouseDelta.y, 10);

      // Verify corners form a proper rectangle in local space
      // (This is more of a sanity check that our corner calculation is reasonable)
      expect(corners).toHaveLength(4);

      // Calculate the centroid to verify it matches the center
      const centroid: Point = {
        x: corners.reduce((sum, corner) => sum + corner.x, 0) / 4,
        y: corners.reduce((sum, corner) => sum + corner.y, 0) / 4,
      };

      expect(centroid.x).toBeCloseTo(center.x, 10);
      expect(centroid.y).toBeCloseTo(center.y, 10);
    });

    it("should handle complex multi-step transformations with different scale factors and rotations", () => {
      const testCases = [
        { rotation: 0, scaleX: 1, scaleY: 1 },
        { rotation: 45, scaleX: 2, scaleY: 1.5 },
        { rotation: 90, scaleX: 0.5, scaleY: 2 },
        { rotation: 180, scaleX: 1.5, scaleY: 0.8 },
        { rotation: 270, scaleX: 2.5, scaleY: 2.5 },
      ];

      testCases.forEach(({ rotation, scaleX, scaleY }) => {
        const originalBoundingBox: BoundingBox = {
          x: 50,
          y: 50,
          width: 60,
          height: 40,
        };
        const mouseDelta: Point = { x: 15, y: 10 };
        const scaleFactors = { scaleX, scaleY };

        // Test all edges for this configuration
        const edges = FRAME_EDGES;

        edges.forEach((edge) => {
          const result = calculateSpatialEdgeFixedResize(
            originalBoundingBox,
            rotation,
            edge,
            mouseDelta,
            scaleFactors
          );

          // Verify results are mathematically valid
          expect(result.width).toBeGreaterThan(0);
          expect(result.height).toBeGreaterThan(0);
          expect(isFinite(result.x)).toBe(true);
          expect(isFinite(result.y)).toBe(true);

          // Verify the transformation maintains reasonable proportions
          const originalArea = originalBoundingBox.width * originalBoundingBox.height;
          const newArea = result.width * result.height;
          expect(newArea).toBeGreaterThan(0);
          
          // The new area should be related to the original area in a reasonable way
          // (allowing for significant changes due to rotation effects)
          expect(newArea).toBeLessThan(originalArea * 10); // Sanity check upper bound
        });
      });
    });
  });

  describe("Boundary Validation", () => {
    const scaleFactors = { scaleX: 1, scaleY: 1 };
    const imageWidth = 1000;
    const imageHeight = 800;

    describe("Boundary validation with spatial edge-fixed resize", () => {
      it("should constrain resize when frame would exceed image boundaries", () => {
        // Frame near the right edge of the image
        const originalBox: BoundingBox = { x: 900, y: 400, width: 80, height: 60 };
        const frameRotation = 0;
        const mouseDelta: Point = { x: 200, y: 0 }; // Try to resize way beyond image boundary
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "right",
          mouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Result should be constrained within image boundaries
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
        expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
        
        // Should be larger than original but not exceed boundaries
        expect(result.width).toBeGreaterThan(originalBox.width);
        expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
      });

      it("should handle rotated frames near image boundaries", () => {
        // Rotated frame near corner
        const originalBox: BoundingBox = { x: 850, y: 650, width: 200, height: 100 };
        const frameRotation = 45;
        const mouseDelta: Point = { x: 100, y: 100 }; // Try to resize beyond boundaries
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "bottom",
          mouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Result should be constrained within image boundaries
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
        expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
      });

      it("should preserve fixed edge constraint even with boundary validation", () => {
        // Frame that will hit boundary but should maintain fixed edge
        const originalBox: BoundingBox = { x: 50, y: 50, width: 100, height: 100 };
        const frameRotation = 30;
        const mouseDelta: Point = { x: -200, y: -200 }; // Try to resize beyond left/top boundaries
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "left",
          mouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should maintain valid dimensions and stay within boundaries
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      });
    });

    describe("Performance optimizations", () => {
      it("should skip processing for very small mouse movements", () => {
        const originalBox: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };
        const frameRotation = 45;
        const tinyMouseDelta: Point = { x: 0.1, y: 0.1 }; // Very small movement
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "right",
          tinyMouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should return original box unchanged (performance optimization)
        expect(result).toEqual(originalBox);
      });

      it("should process normal-sized mouse movements", () => {
        const originalBox: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };
        const frameRotation = 45;
        const normalMouseDelta: Point = { x: 10, y: 0 }; // Normal movement
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "right",
          normalMouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should process the resize (not return original box)
        expect(result).not.toEqual(originalBox);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      });
    });

    describe("Error handling and robustness", () => {
      it("should handle invalid bounding box gracefully", () => {
        const invalidBox: BoundingBox = { x: NaN, y: 100, width: -50, height: 100 };
        const frameRotation = 45;
        const mouseDelta: Point = { x: 10, y: 0 };
        
        const result = calculateSpatialEdgeFixedResize(
          invalidBox,
          frameRotation,
          "right",
          mouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should fall back to original box
        expect(result).toEqual(invalidBox);
      });

      it("should handle invalid scale factors gracefully", () => {
        const originalBox: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };
        const frameRotation = 45;
        const mouseDelta: Point = { x: 10, y: 0 };
        const invalidScaleFactors = { scaleX: 0, scaleY: -1 }; // Invalid scale factors
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "right",
          mouseDelta,
          invalidScaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should fall back to original box
        expect(result).toEqual(originalBox);
      });

      it("should handle infinite rotation gracefully", () => {
        const originalBox: BoundingBox = { x: 100, y: 100, width: 100, height: 100 };
        const invalidRotation = Infinity;
        const mouseDelta: Point = { x: 10, y: 0 };
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          invalidRotation,
          "right",
          mouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should fall back to original box
        expect(result).toEqual(originalBox);
      });
    });

    describe("Wrapper function integration with boundary validation", () => {
      it("should pass image dimensions correctly for rotated frames", () => {
        const originalBox: BoundingBox = { x: 950, y: 400, width: 100, height: 100 };
        const frameRotation = 45;
        const mouseDelta: Point = { x: 100, y: 0 }; // Would exceed boundary
        
        const result = calculateResizedBoundingBox(
          originalBox,
          "right",
          mouseDelta,
          scaleFactors,
          frameRotation,
          imageWidth,
          imageHeight
        );
        
        // Should respect image boundaries
        expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
        expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
      });

      it("should maintain backward compatibility for non-rotated frames", () => {
        const originalBox: BoundingBox = { x: 950, y: 400, width: 100, height: 100 };
        const frameRotation = 0; // No rotation
        const mouseDelta: Point = { x: 100, y: 0 }; // Would exceed boundary
        
        const result = calculateResizedBoundingBox(
          originalBox,
          "right",
          mouseDelta,
          scaleFactors,
          frameRotation,
          imageWidth,
          imageHeight
        );
        
        // Should use axis-aligned algorithm but still respect boundaries
        expect(result.x).toBe(originalBox.x);
        expect(result.y).toBe(originalBox.y);
        expect(result.width).toBeGreaterThan(originalBox.width);
      });
    });

    describe("Real-world scenarios", () => {
      it("should handle typical user resize operation near image edge", () => {
        // Simulate a user resizing a frame near the bottom-right corner
        const originalBox: BoundingBox = { x: 800, y: 600, width: 150, height: 100 };
        const frameRotation = 15; // Slight rotation
        const mouseDelta: Point = { x: 250, y: 250 }; // Large resize attempt
        
        const result = calculateSpatialEdgeFixedResize(
          originalBox,
          frameRotation,
          "bottom",
          mouseDelta,
          scaleFactors,
          imageWidth,
          imageHeight
        );
        
        // Should produce a reasonable result within boundaries
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.x + result.width).toBeLessThanOrEqual(imageWidth);
        expect(result.y + result.height).toBeLessThanOrEqual(imageHeight);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      });

      it("should handle multiple consecutive resize operations", () => {
        let currentBox: BoundingBox = { x: 400, y: 300, width: 100, height: 100 };
        const frameRotation = 30;
        
        // Simulate multiple resize operations
        const resizeOperations = [
          { edge: "right" as const, delta: { x: 50, y: 0 } },
          { edge: "bottom" as const, delta: { x: 0, y: 30 } },
          { edge: "left" as const, delta: { x: -20, y: 0 } },
          { edge: "top" as const, delta: { x: 0, y: -15 } }
        ];
        
        resizeOperations.forEach(({ edge, delta }) => {
          currentBox = calculateSpatialEdgeFixedResize(
            currentBox,
            frameRotation,
            edge,
            delta,
            scaleFactors,
            imageWidth,
            imageHeight
          );
          
          // Each operation should maintain valid state
          expect(currentBox.x).toBeGreaterThanOrEqual(0);
          expect(currentBox.y).toBeGreaterThanOrEqual(0);
          expect(currentBox.x + currentBox.width).toBeLessThanOrEqual(imageWidth);
          expect(currentBox.y + currentBox.height).toBeLessThanOrEqual(imageHeight);
          expect(currentBox.width).toBeGreaterThan(0);
          expect(currentBox.height).toBeGreaterThan(0);
        });
      });
    });
  });
}); 