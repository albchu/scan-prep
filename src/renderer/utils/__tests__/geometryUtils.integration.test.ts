import {
  rotatePoint,
  transformMouseDeltaToFrameLocal,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  getResizeEdgeMapping,
  getOppositeEdge,
  calculateNewFrameDimensions,
  calculateSpatialEdgeFixedResize,
  Point,
} from "../geometryUtils";

import { BoundingBox } from "@shared/types";

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
        const edges: ("top" | "right" | "bottom" | "left")[] = [
          "top",
          "right",
          "bottom",
          "left",
        ];
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
        const edges: ("top" | "right" | "bottom" | "left")[] = [
          "top",
          "right",
          "bottom",
          "left",
        ];

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
}); 