import { getFixedEdgeCenter, calculateRotatedCorners, Point } from "../geometryUtils";

describe("getFixedEdgeCenter", () => {
  it("should calculate correct edge centers for axis-aligned rectangle", () => {
    const center: Point = { x: 100, y: 100 };
    const width = 40;
    const height = 20;
    const corners = calculateRotatedCorners(center, width, height, 0);

    // For 0° rotation: corners are [topLeft, topRight, bottomRight, bottomLeft]
    // topLeft: (80, 90), topRight: (120, 90), bottomRight: (120, 110), bottomLeft: (80, 110)

    const topCenter = getFixedEdgeCenter(corners, "top");
    expect(topCenter.x).toBeCloseTo(100, 10); // midpoint of (80, 90) and (120, 90)
    expect(topCenter.y).toBeCloseTo(90, 10);

    const rightCenter = getFixedEdgeCenter(corners, "right");
    expect(rightCenter.x).toBeCloseTo(120, 10); // midpoint of (120, 90) and (120, 110)
    expect(rightCenter.y).toBeCloseTo(100, 10);

    const bottomCenter = getFixedEdgeCenter(corners, "bottom");
    expect(bottomCenter.x).toBeCloseTo(100, 10); // midpoint of (120, 110) and (80, 110)
    expect(bottomCenter.y).toBeCloseTo(110, 10);

    const leftCenter = getFixedEdgeCenter(corners, "left");
    expect(leftCenter.x).toBeCloseTo(80, 10); // midpoint of (80, 110) and (80, 90)
    expect(leftCenter.y).toBeCloseTo(100, 10);
  });

  it("should calculate correct edge centers for 90° rotated rectangle", () => {
    const center: Point = { x: 100, y: 100 };
    const width = 40;
    const height = 20;
    const corners = calculateRotatedCorners(center, width, height, 90);

    // After 90° rotation, the rectangle is rotated clockwise
    // Original local corners: [(-20, -10), (20, -10), (20, 10), (-20, 10)]
    // After 90° rotation: [(10, -20), (10, 20), (-10, 20), (-10, -20)]
    // With center (100, 100): [(110, 80), (110, 120), (90, 120), (90, 80)]

    const topCenter = getFixedEdgeCenter(corners, "top");
    expect(topCenter.x).toBeCloseTo(110, 10); // midpoint of (110, 80) and (110, 120)
    expect(topCenter.y).toBeCloseTo(100, 10);

    const rightCenter = getFixedEdgeCenter(corners, "right");
    expect(rightCenter.x).toBeCloseTo(100, 10); // midpoint of (110, 120) and (90, 120)
    expect(rightCenter.y).toBeCloseTo(120, 10);

    const bottomCenter = getFixedEdgeCenter(corners, "bottom");
    expect(bottomCenter.x).toBeCloseTo(90, 10); // midpoint of (90, 120) and (90, 80)
    expect(bottomCenter.y).toBeCloseTo(100, 10);

    const leftCenter = getFixedEdgeCenter(corners, "left");
    expect(leftCenter.x).toBeCloseTo(100, 10); // midpoint of (90, 80) and (110, 80)
    expect(leftCenter.y).toBeCloseTo(80, 10);
  });

  it("should calculate correct edge centers for 45° rotated rectangle", () => {
    const center: Point = { x: 0, y: 0 }; // Use origin for easier calculation
    const width = 20;
    const height = 20; // Square for symmetry
    const corners = calculateRotatedCorners(center, width, height, 45);

    // For a square rotated 45°, the edge centers should be at distance equal to half the diagonal
    // The diagonal of the square is sqrt(width^2 + height^2) = sqrt(400 + 400) = sqrt(800) = 20√2
    // But the edge centers are at distance = half the side length = 10
    // Actually, let me calculate this more carefully...
    // For a 20x20 square rotated 45°, the edge centers should be at distance 10 from center
    const expectedDistance = 10; // Half the side length

    const edges: ("top" | "right" | "bottom" | "left")[] = [
      "top",
      "right",
      "bottom",
      "left",
    ];
    edges.forEach((edge) => {
      const edgeCenter = getFixedEdgeCenter(corners, edge);
      const distance = Math.sqrt(
        edgeCenter.x * edgeCenter.x + edgeCenter.y * edgeCenter.y
      );
      expect(distance).toBeCloseTo(expectedDistance, 10);
    });
  });
}); 