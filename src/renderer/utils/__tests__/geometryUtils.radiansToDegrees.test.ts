import { radiansToDegrees, degreesToRadians } from "../geometryUtils";

describe("radiansToDegrees", () => {
  it("should convert common angles correctly", () => {
    expect(radiansToDegrees(0)).toBe(0);
    expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180, 10);
    expect(radiansToDegrees((3 * Math.PI) / 2)).toBeCloseTo(270, 10);
    expect(radiansToDegrees(2 * Math.PI)).toBeCloseTo(360, 10);
  });

  it("should handle negative angles", () => {
    expect(radiansToDegrees(-Math.PI / 2)).toBeCloseTo(-90, 10);
    expect(radiansToDegrees(-Math.PI)).toBeCloseTo(-180, 10);
  });

  it("should be inverse of degreesToRadians", () => {
    const testAngles = [0, 30, 45, 90, 135, 180, 270, 360, -90, -180];
    testAngles.forEach((angle) => {
      const radians = degreesToRadians(angle);
      const backToDegrees = radiansToDegrees(radians);
      expect(backToDegrees).toBeCloseTo(angle, 10);
    });
  });
}); 