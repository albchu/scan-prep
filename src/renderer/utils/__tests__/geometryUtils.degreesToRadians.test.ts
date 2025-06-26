import { degreesToRadians } from "../geometryUtils";

describe("degreesToRadians", () => {
  it("should convert common angles correctly", () => {
    expect(degreesToRadians(0)).toBe(0);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI, 10);
    expect(degreesToRadians(270)).toBeCloseTo((3 * Math.PI) / 2, 10);
    expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI, 10);
  });

  it("should handle negative angles", () => {
    expect(degreesToRadians(-90)).toBeCloseTo(-Math.PI / 2, 10);
    expect(degreesToRadians(-180)).toBeCloseTo(-Math.PI, 10);
  });

  it("should handle fractional angles", () => {
    expect(degreesToRadians(45)).toBeCloseTo(Math.PI / 4, 10);
    expect(degreesToRadians(30)).toBeCloseTo(Math.PI / 6, 10);
  });
}); 