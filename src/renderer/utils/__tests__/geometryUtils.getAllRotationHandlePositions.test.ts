import { getAllRotationHandlePositions } from "../geometryUtils";

describe("getAllRotationHandlePositions", () => {
  it("should calculate handle positions for all corners", () => {
    const corners = [
      { x: 0, y: 0 }, // Top-left
      { x: 20, y: 0 }, // Top-right
      { x: 20, y: 10 }, // Bottom-right
      { x: 0, y: 10 }, // Bottom-left
    ];
    const center = { x: 10, y: 5 };
    const handleOffset = 15;

    const handles = getAllRotationHandlePositions(
      corners,
      center,
      handleOffset
    );

    expect(handles).toHaveLength(4);

    // Each handle should be offset from its corner in the direction away from center
    handles.forEach((handle, index) => {
      const corner = corners[index];
      const distanceFromCorner = Math.sqrt(
        (handle.x - corner.x) ** 2 + (handle.y - corner.y) ** 2
      );
      expect(distanceFromCorner).toBeCloseTo(handleOffset, 10);
    });
  });

  it("should use default offset when not provided", () => {
    const corners = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const center = { x: 5, y: 5 };

    const handles = getAllRotationHandlePositions(corners, center);

    expect(handles).toHaveLength(4);
    // Default offset should be 20
    handles.forEach((handle, index) => {
      const corner = corners[index];
      const distanceFromCorner = Math.sqrt(
        (handle.x - corner.x) ** 2 + (handle.y - corner.y) ** 2
      );
      expect(distanceFromCorner).toBeCloseTo(20, 10);
    });
  });
}); 