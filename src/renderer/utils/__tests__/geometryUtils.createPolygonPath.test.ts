import { createPolygonPath } from "../geometryUtils";

describe("createPolygonPath", () => {
  it("should create correct SVG path for triangle", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ];

    const result = createPolygonPath(points);

    expect(result).toBe("M 0 0 L 10 0 L 5 10 Z");
  });

  it("should create correct SVG path for rectangle", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 0, y: 10 },
    ];

    const result = createPolygonPath(points);

    expect(result).toBe("M 0 0 L 20 0 L 20 10 L 0 10 Z");
  });

  it("should return empty string for empty points array", () => {
    const result = createPolygonPath([]);
    expect(result).toBe("");
  });

  it("should handle single point", () => {
    const points = [{ x: 5, y: 5 }];
    const result = createPolygonPath(points);
    expect(result).toBe("M 5 5 Z");
  });

  it("should handle fractional coordinates", () => {
    const points = [
      { x: 1.5, y: 2.7 },
      { x: 3.2, y: 4.8 },
    ];

    const result = createPolygonPath(points);
    expect(result).toBe("M 1.5 2.7 L 3.2 4.8 Z");
  });
}); 