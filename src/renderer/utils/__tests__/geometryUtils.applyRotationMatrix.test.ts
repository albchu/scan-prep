import { applyRotationMatrix } from "../geometryUtils";

describe("applyRotationMatrix", () => {
  it("should handle zero rotation", () => {
    const point = { x: 5, y: 3 };
    const result = applyRotationMatrix(point, 0);
    expect(result.x).toBeCloseTo(5, 10);
    expect(result.y).toBeCloseTo(3, 10);
  });

  it("should handle 90 degree rotation", () => {
    const point = { x: 1, y: 0 };
    const result = applyRotationMatrix(point, Math.PI / 2);
    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(1, 10);
  });

  it("should handle 180 degree rotation", () => {
    const point = { x: 1, y: 1 };
    const result = applyRotationMatrix(point, Math.PI);
    expect(result.x).toBeCloseTo(-1, 10);
    expect(result.y).toBeCloseTo(-1, 10);
  });

  it("should handle arbitrary rotation", () => {
    const point = { x: 1, y: 0 };
    const angle = Math.PI / 4; // 45 degrees
    const result = applyRotationMatrix(point, angle);
    const expected = 1 / Math.sqrt(2);
    expect(result.x).toBeCloseTo(expected, 10);
    expect(result.y).toBeCloseTo(expected, 10);
  });
}); 