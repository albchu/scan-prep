import { calculateNewFrameDimensions, Point } from "../geometryUtils";

describe("calculateNewFrameDimensions", () => {
  it("should calculate correct dimensions for top edge resize", () => {
    const originalWidth = 100;
    const originalHeight = 80;
    const localMouseDelta: Point = { x: 0, y: -20 }; // Move up by 20

    const result = calculateNewFrameDimensions(
      originalWidth,
      originalHeight,
      "top",
      localMouseDelta
    );

    expect(result.width).toBe(100); // Width unchanged
    expect(result.height).toBe(100); // Height increased by 20 (original 80 - (-20))
  });

  it("should calculate correct dimensions for right edge resize", () => {
    const originalWidth = 100;
    const originalHeight = 80;
    const localMouseDelta: Point = { x: 30, y: 0 }; // Move right by 30

    const result = calculateNewFrameDimensions(
      originalWidth,
      originalHeight,
      "right",
      localMouseDelta
    );

    expect(result.width).toBe(130); // Width increased by 30
    expect(result.height).toBe(80); // Height unchanged
  });

  it("should calculate correct dimensions for bottom edge resize", () => {
    const originalWidth = 100;
    const originalHeight = 80;
    const localMouseDelta: Point = { x: 0, y: 25 }; // Move down by 25

    const result = calculateNewFrameDimensions(
      originalWidth,
      originalHeight,
      "bottom",
      localMouseDelta
    );

    expect(result.width).toBe(100); // Width unchanged
    expect(result.height).toBe(105); // Height increased by 25
  });

  it("should calculate correct dimensions for left edge resize", () => {
    const originalWidth = 100;
    const originalHeight = 80;
    const localMouseDelta: Point = { x: -15, y: 0 }; // Move left by 15

    const result = calculateNewFrameDimensions(
      originalWidth,
      originalHeight,
      "left",
      localMouseDelta
    );

    expect(result.width).toBe(115); // Width increased by 15 (original 100 - (-15))
    expect(result.height).toBe(80); // Height unchanged
  });

  it("should enforce minimum width constraints", () => {
    const originalWidth = 50;
    const originalHeight = 60;
    const minWidth = 20;

    // For left edge resize: newWidth = originalWidth - localMouseDelta.x
    // To make width negative, we need positive localMouseDelta.x > originalWidth
    const negativeMouseDelta: Point = { x: 60, y: 0 }; // Move right by 60, making width = 50 - 60 = -10

    const negativeResult = calculateNewFrameDimensions(
      originalWidth,
      originalHeight,
      "left",
      negativeMouseDelta,
      minWidth
    );

    expect(negativeResult.width).toBe(minWidth); // Clamped to minimum
    expect(negativeResult.height).toBe(60); // Height unchanged
  });

  it("should enforce minimum height constraints", () => {
    const originalWidth = 50;
    const originalHeight = 60;
    const minHeight = 25;

    // For top edge resize: newHeight = originalHeight - localMouseDelta.y
    // To make height negative, we need positive localMouseDelta.y > originalHeight
    const negativeMouseDelta: Point = { x: 0, y: 70 }; // Move down by 70, making height = 60 - 70 = -10

    const result = calculateNewFrameDimensions(
      originalWidth,
      originalHeight,
      "top",
      negativeMouseDelta,
      20,
      minHeight
    );

    expect(result.width).toBe(50); // Width unchanged
    expect(result.height).toBe(minHeight); // Clamped to minimum
  });
}); 