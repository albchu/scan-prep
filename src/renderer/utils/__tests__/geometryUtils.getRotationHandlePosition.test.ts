import { getRotationHandlePosition } from "../geometryUtils";

describe("getRotationHandlePosition", () => {
  it("should calculate handle position for top-right corner", () => {
    const corners = [
      { x: 0, y: 0 }, // Top-left
      { x: 20, y: 0 }, // Top-right
      { x: 20, y: 10 }, // Bottom-right
      { x: 0, y: 10 }, // Bottom-left
    ];
    const center = { x: 10, y: 5 };
    const handleOffset = 15;

    const handle = getRotationHandlePosition(corners, center, handleOffset);

    // Should be offset from top-right corner (20, 0) in direction away from center
    const topRight = corners[1];
    const distanceFromCorner = Math.sqrt(
      (handle.x - topRight.x) ** 2 + (handle.y - topRight.y) ** 2
    );
    expect(distanceFromCorner).toBeCloseTo(handleOffset, 10);

    // Should be in the direction away from center
    const angleToCenter = Math.atan2(
      center.y - topRight.y,
      center.x - topRight.x
    );
    const angleToHandle = Math.atan2(
      handle.y - topRight.y,
      handle.x - topRight.x
    );
    const angleDifference = Math.abs(angleToCenter - angleToHandle);
    expect(angleDifference).toBeCloseTo(Math.PI, 10); // 180 degrees apart
  });

  it("should use default offset when not provided", () => {
    const corners = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const center = { x: 5, y: 5 };

    const handle = getRotationHandlePosition(corners, center);

    const topRight = corners[1];
    const distanceFromCorner = Math.sqrt(
      (handle.x - topRight.x) ** 2 + (handle.y - topRight.y) ** 2
    );
    expect(distanceFromCorner).toBeCloseTo(20, 10); // Default offset
  });
}); 