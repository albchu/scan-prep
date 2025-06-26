import { calculateAxisAlignedBoundingBox, Point } from "../geometryUtils";

describe("calculateAxisAlignedBoundingBox", () => {
  it("should calculate correct bounding box for 0° rotation", () => {
    const frameCenter: Point = { x: 100, y: 100 };
    const frameWidth = 60;
    const frameHeight = 40;
    const frameRotation = 0;

    const result = calculateAxisAlignedBoundingBox(
      frameCenter,
      frameWidth,
      frameHeight,
      frameRotation
    );

    // For 0° rotation, bounding box should match frame exactly
    expect(result.x).toBeCloseTo(70, 10); // 100 - 30
    expect(result.y).toBeCloseTo(80, 10); // 100 - 20
    expect(result.width).toBeCloseTo(60, 10);
    expect(result.height).toBeCloseTo(40, 10);
  });

  it("should calculate correct bounding box for 90° rotation", () => {
    const frameCenter: Point = { x: 100, y: 100 };
    const frameWidth = 60;
    const frameHeight = 40;
    const frameRotation = 90;

    const result = calculateAxisAlignedBoundingBox(
      frameCenter,
      frameWidth,
      frameHeight,
      frameRotation
    );

    // For 90° rotation, width and height should be swapped
    expect(result.x).toBeCloseTo(80, 10); // 100 - 20
    expect(result.y).toBeCloseTo(70, 10); // 100 - 30
    expect(result.width).toBeCloseTo(40, 10); // Original height
    expect(result.height).toBeCloseTo(60, 10); // Original width
  });

  it("should calculate correct bounding box for 45° rotation", () => {
    const frameCenter: Point = { x: 0, y: 0 }; // Origin for easier calculation
    const frameWidth = 20;
    const frameHeight = 20; // Square for symmetry
    const frameRotation = 45;

    const result = calculateAxisAlignedBoundingBox(
      frameCenter,
      frameWidth,
      frameHeight,
      frameRotation
    );

    // For 45° rotated square, diagonal becomes the bounding box dimension
    const expectedSize = 20 * Math.sqrt(2);
    expect(result.width).toBeCloseTo(expectedSize, 10);
    expect(result.height).toBeCloseTo(expectedSize, 10);
    expect(result.x).toBeCloseTo(-expectedSize / 2, 10);
    expect(result.y).toBeCloseTo(-expectedSize / 2, 10);
  });

  it("should handle arbitrary rotation angles", () => {
    const frameCenter: Point = { x: 50, y: 75 };
    const frameWidth = 30;
    const frameHeight = 40;
    const frameRotation = 37.5;

    const result = calculateAxisAlignedBoundingBox(
      frameCenter,
      frameWidth,
      frameHeight,
      frameRotation
    );

    // Should produce valid bounding box
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.width).toBeGreaterThanOrEqual(
      Math.max(frameWidth, frameHeight)
    );
    expect(result.height).toBeGreaterThanOrEqual(
      Math.max(frameWidth, frameHeight)
    );

    // Center should be preserved
    const calculatedCenter = {
      x: result.x + result.width / 2,
      y: result.y + result.height / 2,
    };
    expect(calculatedCenter.x).toBeCloseTo(frameCenter.x, 10);
    expect(calculatedCenter.y).toBeCloseTo(frameCenter.y, 10);
  });
}); 