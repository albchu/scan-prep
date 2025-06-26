import { applyInverseRotationMatrix, applyRotationMatrix } from "../geometryUtils";

describe("applyInverseRotationMatrix", () => {
  it("should be inverse of applyRotationMatrix", () => {
    const point = { x: 3, y: 4 };
    const angle = Math.PI / 3; // 60 degrees

    const rotated = applyRotationMatrix(point, angle);
    const backToOriginal = applyInverseRotationMatrix(rotated, angle);

    expect(backToOriginal.x).toBeCloseTo(point.x, 10);
    expect(backToOriginal.y).toBeCloseTo(point.y, 10);
  });

  it("should handle zero angle", () => {
    const point = { x: 2, y: 7 };
    const result = applyInverseRotationMatrix(point, 0);
    expect(result.x).toBeCloseTo(2, 10);
    expect(result.y).toBeCloseTo(7, 10);
  });
}); 