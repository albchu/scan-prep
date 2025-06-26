import { rotatePoint, Point } from "../geometryUtils";

describe("rotatePoint", () => {
  it("should handle 0 degree rotation (no change)", () => {
    const point: Point = { x: 10, y: 5 };
    const result = rotatePoint(point, 0);

    expect(result.x).toBeCloseTo(10, 10);
    expect(result.y).toBeCloseTo(5, 10);
  });

  it("should handle 90 degree clockwise rotation", () => {
    const point: Point = { x: 10, y: 0 };
    const result = rotatePoint(point, 90);

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(10, 10);
  });

  it("should handle 180 degree rotation", () => {
    const point: Point = { x: 10, y: 5 };
    const result = rotatePoint(point, 180);

    expect(result.x).toBeCloseTo(-10, 10);
    expect(result.y).toBeCloseTo(-5, 10);
  });

  it("should handle 270 degree rotation", () => {
    const point: Point = { x: 10, y: 0 };
    const result = rotatePoint(point, 270);

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(-10, 10);
  });

  it("should handle 45 degree rotation", () => {
    const point: Point = { x: 10, y: 0 };
    const result = rotatePoint(point, 45);

    const expected = 10 / Math.sqrt(2); // 10 * cos(45°) = 10 * sin(45°)
    expect(result.x).toBeCloseTo(expected, 10);
    expect(result.y).toBeCloseTo(expected, 10);
  });

  it("should handle negative angles", () => {
    const point: Point = { x: 10, y: 0 };
    const result = rotatePoint(point, -90);

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(-10, 10);
  });

  it("should handle angles greater than 360 degrees", () => {
    const point: Point = { x: 10, y: 0 };
    const result = rotatePoint(point, 450); // 450° = 90°

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(10, 10);
  });

  it("should handle origin point", () => {
    const point: Point = { x: 0, y: 0 };
    const result = rotatePoint(point, 45);

    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(0, 10);
  });
}); 