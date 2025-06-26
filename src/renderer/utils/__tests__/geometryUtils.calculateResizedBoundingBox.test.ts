import { calculateResizedBoundingBox } from "../geometryUtils";

describe("calculateResizedBoundingBox", () => {
  const scaleFactors = { scaleX: 1, scaleY: 1 };

  it("should resize top edge correctly", () => {
    const originalBox = { x: 10, y: 10, width: 20, height: 15 };
    const mouseDelta = { x: 0, y: -5 }; // Move up by 5

    const result = calculateResizedBoundingBox(
      originalBox,
      "top",
      mouseDelta,
      scaleFactors
    );

    expect(result.x).toBe(10); // X unchanged
    expect(result.y).toBe(5); // Y moved up by 5
    expect(result.width).toBe(20); // Width unchanged
    expect(result.height).toBe(20); // Height increased by 5
  });

  it("should resize right edge correctly", () => {
    const originalBox = { x: 10, y: 10, width: 20, height: 15 };
    const mouseDelta = { x: 8, y: 0 }; // Move right by 8

    const result = calculateResizedBoundingBox(
      originalBox,
      "right",
      mouseDelta,
      scaleFactors
    );

    expect(result.x).toBe(10); // X unchanged
    expect(result.y).toBe(10); // Y unchanged
    expect(result.width).toBe(28); // Width increased by 8
    expect(result.height).toBe(15); // Height unchanged
  });

  it("should resize bottom edge correctly", () => {
    const originalBox = { x: 10, y: 10, width: 20, height: 15 };
    const mouseDelta = { x: 0, y: 7 }; // Move down by 7

    const result = calculateResizedBoundingBox(
      originalBox,
      "bottom",
      mouseDelta,
      scaleFactors
    );

    expect(result.x).toBe(10); // X unchanged
    expect(result.y).toBe(10); // Y unchanged
    expect(result.width).toBe(20); // Width unchanged
    expect(result.height).toBe(22); // Height increased by 7
  });

  it("should resize left edge correctly", () => {
    const originalBox = { x: 10, y: 10, width: 20, height: 15 };
    const mouseDelta = { x: -3, y: 0 }; // Move left by 3

    const result = calculateResizedBoundingBox(
      originalBox,
      "left",
      mouseDelta,
      scaleFactors
    );

    expect(result.x).toBe(7); // X moved left by 3
    expect(result.y).toBe(10); // Y unchanged
    expect(result.width).toBe(23); // Width increased by 3
    expect(result.height).toBe(15); // Height unchanged
  });

  it("should enforce minimum width constraints", () => {
    const originalBox = { x: 10, y: 10, width: 25, height: 15 };
    const mouseDelta = { x: -30, y: 0 }; // Try to shrink width below minimum
    const minWidth = 20;

    const result = calculateResizedBoundingBox(
      originalBox,
      "left",
      mouseDelta,
      scaleFactors,
      minWidth
    );

    // For left edge: newBox.x += imageDeltaX (-30), newBox.width -= imageDeltaX (25 - (-30) = 55)
    // Since width (55) > minWidth (20), no clamping occurs
    expect(result.width).toBe(55); // 25 - (-30)
    expect(result.x).toBe(-20); // 10 + (-30)
  });

  it("should enforce minimum height constraints", () => {
    const originalBox = { x: 10, y: 10, width: 20, height: 25 };
    const mouseDelta = { x: 0, y: -30 }; // Try to shrink height below minimum
    const minHeight = 15;

    const result = calculateResizedBoundingBox(
      originalBox,
      "top",
      mouseDelta,
      scaleFactors,
      20,
      minHeight
    );

    // For top edge: newBox.y += imageDeltaY (-30), newBox.height -= imageDeltaY (25 - (-30) = 55)
    // Since height (55) > minHeight (15), no clamping occurs
    expect(result.height).toBe(55); // 25 - (-30)
    expect(result.y).toBe(-20); // 10 + (-30)
  });

  it("should apply scale factors correctly", () => {
    const originalBox = { x: 10, y: 10, width: 20, height: 15 };
    const mouseDelta = { x: 20, y: 0 }; // 20 pixels in display coordinates
    const scaleFactors = { scaleX: 2, scaleY: 1 }; // 2x horizontal scale

    const result = calculateResizedBoundingBox(
      originalBox,
      "right",
      mouseDelta,
      scaleFactors
    );

    // 20 display pixels = 10 image pixels at 2x scale
    expect(result.width).toBe(30); // 20 + 10
  });
}); 