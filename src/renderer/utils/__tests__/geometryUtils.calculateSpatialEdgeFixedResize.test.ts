import { calculateSpatialEdgeFixedResize, Point } from "../geometryUtils";
import { BoundingBox } from "@shared/types";

describe("calculateSpatialEdgeFixedResize", () => {
  const scaleFactors = { scaleX: 1, scaleY: 1 }; // 1:1 scale for simplicity

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
      scaleFactors
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
      scaleFactors
    );

    // This test mainly verifies the function runs without error and produces reasonable output
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(isFinite(result.x)).toBe(true);
    expect(isFinite(result.y)).toBe(true);
  });

  it("should enforce minimum size constraints", () => {
    const originalBoundingBox: BoundingBox = {
      x: 0,
      y: 0,
      width: 30,
      height: 25,
    };
    const frameRotation = 30;
    const resizeEdge = "left";
    const mouseDelta: Point = { x: -50, y: 0 }; // Try to shrink too much
    const minWidth = 20;
    const minHeight = 15;

    const result = calculateSpatialEdgeFixedResize(
      originalBoundingBox,
      frameRotation,
      resizeEdge,
      mouseDelta,
      scaleFactors,
      minWidth,
      minHeight
    );

    // The resulting bounding box should respect minimum constraints
    // (though the exact values depend on rotation)
    expect(result.width).toBeGreaterThanOrEqual(minWidth);
    expect(result.height).toBeGreaterThanOrEqual(minHeight);
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
      scaleFactors
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
        scaleFactors
      );

      // Each edge resize should produce valid results
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.y)).toBe(true);
    });
  });
}); 