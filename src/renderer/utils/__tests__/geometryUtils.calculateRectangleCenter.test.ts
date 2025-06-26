import { calculateRectangleCenter } from "../geometryUtils";

describe("calculateRectangleCenter", () => {
  it("should calculate center correctly", () => {
    const result = calculateRectangleCenter(10, 20, 30, 40);
    expect(result.x).toBe(25); // 10 + 30/2
    expect(result.y).toBe(40); // 20 + 40/2
  });

  it("should handle zero-sized rectangle", () => {
    const result = calculateRectangleCenter(5, 8, 0, 0);
    expect(result.x).toBe(5);
    expect(result.y).toBe(8);
  });

  it("should handle negative coordinates", () => {
    const result = calculateRectangleCenter(-10, -5, 20, 10);
    expect(result.x).toBe(0); // -10 + 20/2
    expect(result.y).toBe(0); // -5 + 10/2
  });
}); 