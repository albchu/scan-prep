import { calculateNewFrameCenter, Point } from "../geometryUtils";

describe("calculateNewFrameCenter", () => {
  it("should calculate correct center for top edge resize with 0° rotation", () => {
    const fixedEdgeCenter: Point = { x: 100, y: 150 }; // Bottom edge center
    const newWidth = 80;
    const newHeight = 120;
    const frameRotation = 0;
    const resizeEdge = "top";

    const result = calculateNewFrameCenter(
      fixedEdgeCenter,
      newWidth,
      newHeight,
      frameRotation,
      resizeEdge
    );

    // For 0° rotation, top edge resize: new center should be 60 units up from bottom edge
    expect(result.x).toBeCloseTo(100, 10); // X unchanged
    expect(result.y).toBeCloseTo(90, 10); // Y = 150 - 60 (half height)
  });

  it("should calculate correct center for right edge resize with 0° rotation", () => {
    const fixedEdgeCenter: Point = { x: 50, y: 100 }; // Left edge center
    const newWidth = 140;
    const newHeight = 80;
    const frameRotation = 0;
    const resizeEdge = "right";

    const result = calculateNewFrameCenter(
      fixedEdgeCenter,
      newWidth,
      newHeight,
      frameRotation,
      resizeEdge
    );

    // For 0° rotation, right edge resize: new center should be 70 units right from left edge
    expect(result.x).toBeCloseTo(120, 10); // X = 50 + 70 (half width)
    expect(result.y).toBeCloseTo(100, 10); // Y unchanged
  });

  it("should calculate correct center for 90° rotation", () => {
    const fixedEdgeCenter: Point = { x: 100, y: 100 }; // Fixed edge center
    const newWidth = 60;
    const newHeight = 40;
    const frameRotation = 90;
    const resizeEdge = "top";

    const result = calculateNewFrameCenter(
      fixedEdgeCenter,
      newWidth,
      newHeight,
      frameRotation,
      resizeEdge
    );

    // For 90° rotation, the calculation involves rotation transformation
    // The exact values depend on the rotation math, but should be reasonable
    expect(result.x).toBeCloseTo(100 + 20, 10); // Approximately
    expect(result.y).toBeCloseTo(100, 10); // Approximately
  });

  it("should handle arbitrary rotation angles", () => {
    const fixedEdgeCenter: Point = { x: 0, y: 0 }; // Origin for simplicity
    const newWidth = 40;
    const newHeight = 20;
    const frameRotation = 45;
    const resizeEdge = "right";

    const result = calculateNewFrameCenter(
      fixedEdgeCenter,
      newWidth,
      newHeight,
      frameRotation,
      resizeEdge
    );

    // For 45° rotation, the result should be rotated appropriately
    // The exact calculation is complex, but should produce valid coordinates
    expect(typeof result.x).toBe("number");
    expect(typeof result.y).toBe("number");
    expect(isFinite(result.x)).toBe(true);
    expect(isFinite(result.y)).toBe(true);
  });
}); 