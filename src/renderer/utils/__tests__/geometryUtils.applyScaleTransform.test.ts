import { applyScaleTransform } from "../geometryUtils";

describe("applyScaleTransform", () => {
  it("should apply scale factors correctly", () => {
    const point = { x: 10, y: 5 };
    const scaleFactors = { scaleX: 2, scaleY: 3 };
    const result = applyScaleTransform(point, scaleFactors);

    expect(result.x).toBe(20);
    expect(result.y).toBe(15);
  });

  it("should handle 1:1 scale (no change)", () => {
    const point = { x: 7, y: 3 };
    const scaleFactors = { scaleX: 1, scaleY: 1 };
    const result = applyScaleTransform(point, scaleFactors);

    expect(result.x).toBe(7);
    expect(result.y).toBe(3);
  });

  it("should handle fractional scales", () => {
    const point = { x: 20, y: 30 };
    const scaleFactors = { scaleX: 0.5, scaleY: 0.25 };
    const result = applyScaleTransform(point, scaleFactors);

    expect(result.x).toBe(10);
    expect(result.y).toBe(7.5);
  });
}); 