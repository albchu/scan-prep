import { calculateAxisAlignedCorners } from "../geometryUtils";

describe("calculateAxisAlignedCorners", () => {
  it("should calculate corners correctly for rectangle at origin", () => {
    const center = { x: 0, y: 0 };
    const width = 20;
    const height = 10;

    const corners = calculateAxisAlignedCorners(center, width, height);

    expect(corners).toHaveLength(4);
    expect(corners[0]).toEqual({ x: -10, y: -5 }); // topLeft
    expect(corners[1]).toEqual({ x: 10, y: -5 }); // topRight
    expect(corners[2]).toEqual({ x: 10, y: 5 }); // bottomRight
    expect(corners[3]).toEqual({ x: -10, y: 5 }); // bottomLeft
  });

  it("should calculate corners correctly for offset rectangle", () => {
    const center = { x: 100, y: 50 };
    const width = 30;
    const height = 20;

    const corners = calculateAxisAlignedCorners(center, width, height);

    expect(corners[0]).toEqual({ x: 85, y: 40 }); // topLeft
    expect(corners[1]).toEqual({ x: 115, y: 40 }); // topRight
    expect(corners[2]).toEqual({ x: 115, y: 60 }); // bottomRight
    expect(corners[3]).toEqual({ x: 85, y: 60 }); // bottomLeft
  });

  it("should handle zero dimensions", () => {
    const center = { x: 5, y: 3 };
    const width = 0;
    const height = 0;

    const corners = calculateAxisAlignedCorners(center, width, height);

    corners.forEach((corner) => {
      expect(corner.x).toBe(5);
      expect(corner.y).toBe(3);
    });
  });

  it("should return corners in correct order", () => {
    const center = { x: 0, y: 0 };
    const width = 10;
    const height = 6;

    const corners = calculateAxisAlignedCorners(center, width, height);

    // Verify order: [topLeft, topRight, bottomRight, bottomLeft]
    expect(corners[0].x).toBeLessThan(corners[1].x); // topLeft.x < topRight.x
    expect(corners[0].y).toEqual(corners[1].y); // topLeft.y = topRight.y
    expect(corners[1].x).toEqual(corners[2].x); // topRight.x = bottomRight.x
    expect(corners[1].y).toBeLessThan(corners[2].y); // topRight.y < bottomRight.y
    expect(corners[2].x).toBeGreaterThan(corners[3].x); // bottomRight.x > bottomLeft.x
    expect(corners[2].y).toEqual(corners[3].y); // bottomRight.y = bottomLeft.y
    expect(corners[3].x).toEqual(corners[0].x); // bottomLeft.x = topLeft.x
    expect(corners[3].y).toBeGreaterThan(corners[0].y); // bottomLeft.y > topLeft.y
  });
}); 