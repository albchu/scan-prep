import { transformMouseDeltaToFrameLocal, rotatePoint, Point } from "../geometryUtils";

describe("transformMouseDeltaToFrameLocal", () => {
  it("should handle 0 degree rotation (no transformation)", () => {
    const mouseDelta: Point = { x: 10, y: 5 };
    const result = transformMouseDeltaToFrameLocal(mouseDelta, 0);

    expect(result.x).toBeCloseTo(10, 10);
    expect(result.y).toBeCloseTo(5, 10);
  });

  it("should correctly inverse 90 degree rotation", () => {
    const mouseDelta: Point = { x: 10, y: 0 };
    const result = transformMouseDeltaToFrameLocal(mouseDelta, 90);

    // For 90° frame rotation, global +x should map to local +y
    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(-10, 10);
  });

  it("should correctly inverse 180 degree rotation", () => {
    const mouseDelta: Point = { x: 10, y: 5 };
    const result = transformMouseDeltaToFrameLocal(mouseDelta, 180);

    expect(result.x).toBeCloseTo(-10, 10);
    expect(result.y).toBeCloseTo(-5, 10);
  });

  it("should correctly inverse 270 degree rotation", () => {
    const mouseDelta: Point = { x: 10, y: 0 };
    const result = transformMouseDeltaToFrameLocal(mouseDelta, 270);

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(10, 10);
  });

  it("should correctly inverse 45 degree rotation", () => {
    const mouseDelta: Point = { x: 10, y: 0 };
    const result = transformMouseDeltaToFrameLocal(mouseDelta, 45);

    const expected = 10 / Math.sqrt(2);
    expect(result.x).toBeCloseTo(expected, 10);
    expect(result.y).toBeCloseTo(-expected, 10);
  });

  it("should be inverse of rotatePoint", () => {
    const originalDelta: Point = { x: 15, y: 8 };
    const rotation = 37.5;

    // Transform to frame local, then rotate back - should get original
    const localDelta = transformMouseDeltaToFrameLocal(originalDelta, rotation);
    const backToGlobal = rotatePoint(localDelta, rotation);

    expect(backToGlobal.x).toBeCloseTo(originalDelta.x, 10);
    expect(backToGlobal.y).toBeCloseTo(originalDelta.y, 10);
  });

  it("should handle negative rotation angles", () => {
    const mouseDelta: Point = { x: 10, y: 0 };
    const result = transformMouseDeltaToFrameLocal(mouseDelta, -90);

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(10, 10);
  });
}); 