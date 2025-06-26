import { calculateScaleFactors } from "../geometryUtils";

describe("calculateScaleFactors", () => {
  it("should calculate correct scale factors for equal aspect ratios", () => {
    const result = calculateScaleFactors(100, 100, 200, 200);
    expect(result.scaleX).toBe(2);
    expect(result.scaleY).toBe(2);
  });

  it("should calculate correct scale factors for different aspect ratios", () => {
    const result = calculateScaleFactors(100, 50, 300, 200);
    expect(result.scaleX).toBe(3);
    expect(result.scaleY).toBe(4);
  });

  it("should handle fractional scale factors", () => {
    const result = calculateScaleFactors(300, 200, 150, 100);
    expect(result.scaleX).toBe(0.5);
    expect(result.scaleY).toBe(0.5);
  });

  it("should handle zero dimensions gracefully", () => {
    const result = calculateScaleFactors(0, 100, 200, 200);
    expect(result.scaleX).toBe(Infinity);
    expect(result.scaleY).toBe(2);
  });
}); 