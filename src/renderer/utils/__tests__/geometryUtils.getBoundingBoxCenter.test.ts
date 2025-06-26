import { getBoundingBoxCenter } from "../geometryUtils";

describe("getBoundingBoxCenter", () => {
  it("should calculate center for axis-aligned bounding box", () => {
    const boundingBox = { x: 10, y: 20, width: 100, height: 80 };
    const scaleFactors = { scaleX: 2, scaleY: 1.5 };

    const result = getBoundingBoxCenter(boundingBox, scaleFactors);

    // Center should be at (10 + 100/2) * 2 = 120, (20 + 80/2) * 1.5 = 90
    expect(result.x).toBe(120);
    expect(result.y).toBe(90);
  });

  it("should handle 1:1 scale factors", () => {
    const boundingBox = { x: 0, y: 0, width: 40, height: 30 };
    const scaleFactors = { scaleX: 1, scaleY: 1 };

    const result = getBoundingBoxCenter(boundingBox, scaleFactors);

    expect(result.x).toBe(20);
    expect(result.y).toBe(15);
  });

  it("should handle zero-sized bounding box", () => {
    const boundingBox = { x: 50, y: 75, width: 0, height: 0 };
    const scaleFactors = { scaleX: 2, scaleY: 3 };

    const result = getBoundingBoxCenter(boundingBox, scaleFactors);

    expect(result.x).toBe(100); // 50 * 2
    expect(result.y).toBe(225); // 75 * 3
  });
}); 