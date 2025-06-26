import { calculateAngleBetweenPoints } from "../geometryUtils";

describe("calculateAngleBetweenPoints", () => {
  it("should calculate 0 degrees for horizontal right direction", () => {
    const angle = calculateAngleBetweenPoints(0, 0, 10, 0);
    expect(angle).toBe(0);
  });

  it("should calculate 90 degrees for vertical down direction", () => {
    const angle = calculateAngleBetweenPoints(0, 0, 0, 10);
    expect(angle).toBe(90);
  });

  it("should calculate 180 degrees for horizontal left direction", () => {
    const angle = calculateAngleBetweenPoints(0, 0, -10, 0);
    expect(angle).toBe(180);
  });

  it("should calculate -90 degrees for vertical up direction", () => {
    const angle = calculateAngleBetweenPoints(0, 0, 0, -10);
    expect(angle).toBe(-90);
  });

  it("should calculate 45 degrees for diagonal direction", () => {
    const angle = calculateAngleBetweenPoints(0, 0, 10, 10);
    expect(angle).toBeCloseTo(45, 10);
  });

  it("should handle same points (should return 0)", () => {
    const angle = calculateAngleBetweenPoints(5, 5, 5, 5);
    expect(angle).toBe(0);
  });

  it("should handle negative coordinates", () => {
    const angle = calculateAngleBetweenPoints(-5, -5, -15, -15);
    expect(angle).toBeCloseTo(-135, 10);
  });
}); 