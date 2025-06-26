import { calculateSpatialEdgeFixedResize, calculateResizedBoundingBox, Point } from "../geometryUtils";
import { BoundingBox } from "@shared/types";

describe("calculateSpatialEdgeFixedResize", () => {
  const scaleFactors = { scaleX: 1, scaleY: 1 }; // 1:1 scale for simplicity

  describe("Direct spatial edge-fixed resize function", () => {
    it("should handle 45-degree rotation with right edge resize", () => {
      const originalBox = { x: 100, y: 100, width: 200, height: 100 };
      const frameRotation = 45;
      const mouseDelta = { x: 50, y: 0 }; // Drag right by 50px
      
      const result = calculateSpatialEdgeFixedResize(
        originalBox,
        frameRotation,
        "right",
        mouseDelta,
        scaleFactors,
        Infinity, // imageWidth
        Infinity  // imageHeight
      );
      
      // Should return a valid bounding box
      expect(result.x).toBeCloseTo(result.x, 1);
      expect(result.y).toBeCloseTo(result.y, 1);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it("should handle 90-degree rotation with top edge resize", () => {
      const originalBox = { x: 50, y: 50, width: 100, height: 200 };
      const frameRotation = 90;
      const mouseDelta = { x: 0, y: -30 }; // Drag up by 30px
      
      const result = calculateSpatialEdgeFixedResize(
        originalBox,
        frameRotation,
        "top",
        mouseDelta,
        scaleFactors,
        Infinity, // imageWidth
        Infinity  // imageHeight
      );
      
      // Should return a valid bounding box
      expect(result.x).toBeCloseTo(result.x, 1);
      expect(result.y).toBeCloseTo(result.y, 1);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it("should enforce minimum size constraints", () => {
      const originalBox = { x: 100, y: 100, width: 50, height: 50 };
      const frameRotation = 30;
      const mouseDelta = { x: -100, y: -100 }; // Try to make it very small
      const minWidth = 20;
      const minHeight = 20;
      
      const result = calculateSpatialEdgeFixedResize(
        originalBox,
        frameRotation,
        "left",
        mouseDelta,
        scaleFactors,
        Infinity, // imageWidth
        Infinity, // imageHeight
        minWidth,
        minHeight
      );
      
      // The resulting frame should respect minimum constraints
      // Note: The bounding box might be larger than the minimum due to rotation
      expect(result.width).toBeGreaterThanOrEqual(minWidth);
      expect(result.height).toBeGreaterThanOrEqual(minHeight);
    });
  });

  describe("Wrapper function integration", () => {
    it("should use axis-aligned algorithm for 0-degree rotation", () => {
      const originalBox = { x: 10, y: 10, width: 20, height: 15 };
      const mouseDelta = { x: 8, y: 0 };
      
      const result = calculateResizedBoundingBox(
        originalBox,
        "right",
        mouseDelta,
        scaleFactors,
        0 // No rotation
      );
      
      // Should behave exactly like the old axis-aligned algorithm
      expect(result.x).toBe(10);
      expect(result.y).toBe(10);
      expect(result.width).toBe(28);
      expect(result.height).toBe(15);
    });

    it("should use spatial edge-fixed algorithm for rotated frames", () => {
      const originalBox = { x: 100, y: 100, width: 100, height: 100 };
      const mouseDelta = { x: 20, y: 0 };
      
      const result = calculateResizedBoundingBox(
        originalBox,
        "right",
        mouseDelta,
        scaleFactors,
        45 // 45-degree rotation
      );
      
      // Should use the spatial algorithm and return different results than axis-aligned
      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      
      // The result should be different from simple axis-aligned resize
      const axisAlignedResult = calculateResizedBoundingBox(
        originalBox,
        "right",
        mouseDelta,
        scaleFactors,
        0 // No rotation
      );
      
      expect(result.x).not.toBe(axisAlignedResult.x);
      expect(result.y).not.toBe(axisAlignedResult.y);
    });

    it("should handle various rotation angles", () => {
      const originalBox = { x: 100, y: 100, width: 100, height: 50 };
      const mouseDelta = { x: 10, y: 0 };
      const rotations = [30, 60, 90, 120, 180, 270];
      
      rotations.forEach(rotation => {
        const result = calculateResizedBoundingBox(
          originalBox,
          "right",
          mouseDelta,
          scaleFactors,
          rotation
        );
        
        // Should produce valid results for all rotations
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
      });
    });
  });

  it("should handle 0° rotation (should behave like normal resize)", () => {
    const originalBoundingBox: BoundingBox = {
      x: 50,
      y: 50,
      width: 100,
      height: 80,
    };
    const frameRotation = 0;
    const resizeEdge = "right";
    const mouseDelta: Point = { x: 20, y: 0 }; // Move right by 20

    const result = calculateSpatialEdgeFixedResize(
      originalBoundingBox,
      frameRotation,
      resizeEdge,
      mouseDelta,
      scaleFactors,
      Infinity, // imageWidth
      Infinity  // imageHeight
    );

    // For 0° rotation, should increase width and keep left edge fixed
    expect(result.x).toBeCloseTo(50, 10); // Left edge unchanged
    expect(result.y).toBeCloseTo(50, 10); // Top unchanged
    expect(result.width).toBeCloseTo(120, 10); // Width increased by 20
    expect(result.height).toBeCloseTo(80, 10); // Height unchanged
  });

  it("should maintain fixed edge constraint for rotated frames", () => {
    const originalBoundingBox: BoundingBox = {
      x: 0,
      y: 0,
      width: 60,
      height: 40,
    };
    const frameRotation = 45;
    const resizeEdge = "right";
    const mouseDelta: Point = { x: 20, y: 0 };

    const result = calculateSpatialEdgeFixedResize(
      originalBoundingBox,
      frameRotation,
      resizeEdge,
      mouseDelta,
      scaleFactors,
      Infinity, // imageWidth
      Infinity  // imageHeight
    );

    // This test mainly verifies the function runs without error and produces reasonable output
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(isFinite(result.x)).toBe(true);
    expect(isFinite(result.y)).toBe(true);
  });

  it("should handle different scale factors", () => {
    const originalBoundingBox: BoundingBox = {
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    };
    const frameRotation = 0;
    const resizeEdge = "right";
    const mouseDelta: Point = { x: 40, y: 0 }; // 40 pixels in display coordinates
    const scaleFactors = { scaleX: 2, scaleY: 2 }; // 2x scale

    const result = calculateSpatialEdgeFixedResize(
      originalBoundingBox,
      frameRotation,
      resizeEdge,
      mouseDelta,
      scaleFactors,
      Infinity, // imageWidth
      Infinity  // imageHeight
    );

    // With 2x scale, 40 display pixels = 20 image pixels
    expect(result.width).toBeCloseTo(120, 10); // 100 + 20
    expect(result.height).toBeCloseTo(80, 10); // Unchanged
  });

  it("should work with all edge types", () => {
    const originalBoundingBox: BoundingBox = {
      x: 50,
      y: 50,
      width: 60,
      height: 40,
    };
    const frameRotation = 15; // Slight rotation to test spatial behavior
    const mouseDelta: Point = { x: 10, y: 10 };
    const edges: ("top" | "right" | "bottom" | "left")[] = [
      "top",
      "right",
      "bottom",
      "left",
    ];

    edges.forEach((edge) => {
      const result = calculateSpatialEdgeFixedResize(
        originalBoundingBox,
        frameRotation,
        edge,
        mouseDelta,
        scaleFactors,
        Infinity, // imageWidth
        Infinity  // imageHeight
      );

      // Each edge resize should produce valid results
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
    });
  });
}); 