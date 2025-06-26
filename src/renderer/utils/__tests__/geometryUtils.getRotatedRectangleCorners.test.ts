import { getRotatedRectangleCorners } from "../geometryUtils";

describe("getRotatedRectangleCorners", () => {
  it("should calculate corners for 0 degree rotation", () => {
    const boundingBox = { x: 10, y: 10, width: 20, height: 10 };
    const scaleFactors = { scaleX: 1, scaleY: 1 };

    const corners = getRotatedRectangleCorners(boundingBox, 0, scaleFactors);

    expect(corners).toHaveLength(4);
    expect(corners[0]).toEqual({ x: 10, y: 10 }); // Top-left
    expect(corners[1]).toEqual({ x: 30, y: 10 }); // Top-right
    expect(corners[2]).toEqual({ x: 30, y: 20 }); // Bottom-right
    expect(corners[3]).toEqual({ x: 10, y: 20 }); // Bottom-left
  });

  it("should calculate corners for 90 degree rotation", () => {
    const boundingBox = { x: 0, y: 0, width: 20, height: 10 };
    const scaleFactors = { scaleX: 1, scaleY: 1 };

    const corners = getRotatedRectangleCorners(boundingBox, 90, scaleFactors);

    // Center is at (10, 5), after 90° rotation corners should be rotated around center
    expect(corners).toHaveLength(4);
    expect(corners[0].x).toBeCloseTo(15, 10); // Rotated top-left
    expect(corners[0].y).toBeCloseTo(-5, 10);
    expect(corners[1].x).toBeCloseTo(15, 10); // Rotated top-right
    expect(corners[1].y).toBeCloseTo(15, 10);
    expect(corners[2].x).toBeCloseTo(5, 10); // Rotated bottom-right
    expect(corners[2].y).toBeCloseTo(15, 10);
    expect(corners[3].x).toBeCloseTo(5, 10); // Rotated bottom-left
    expect(corners[3].y).toBeCloseTo(-5, 10);
  });

  it("should apply scale factors correctly", () => {
    const boundingBox = { x: 10, y: 10, width: 20, height: 10 };
    const scaleFactors = { scaleX: 2, scaleY: 3 };

    const corners = getRotatedRectangleCorners(boundingBox, 0, scaleFactors);

    // With scaling: center becomes (20*2, 15*3) = (40, 45)
    // Scaled dimensions: 40x30
    expect(corners[0]).toEqual({ x: 20, y: 30 }); // Top-left
    expect(corners[1]).toEqual({ x: 60, y: 30 }); // Top-right
    expect(corners[2]).toEqual({ x: 60, y: 60 }); // Bottom-right
    expect(corners[3]).toEqual({ x: 20, y: 60 }); // Bottom-left
  });
}); 