import { applyInverseScaleTransform, applyScaleTransform } from "../geometryUtils";

describe("applyInverseScaleTransform", () => {
  it("should be inverse of applyScaleTransform", () => {
    const point = { x: 12, y: 8 };
    const scaleFactors = { scaleX: 1.5, scaleY: 2.5 };

    const scaled = applyScaleTransform(point, scaleFactors);
    const backToOriginal = applyInverseScaleTransform(scaled, scaleFactors);

    expect(backToOriginal.x).toBeCloseTo(point.x, 10);
    expect(backToOriginal.y).toBeCloseTo(point.y, 10);
  });

  it("should handle zero scale gracefully", () => {
    const point = { x: 5, y: 3 };
    const scaleFactors = { scaleX: 0, scaleY: 2 };
    const result = applyInverseScaleTransform(point, scaleFactors);

    expect(result.x).toBe(Infinity);
    expect(result.y).toBe(1.5);
  });
}); 