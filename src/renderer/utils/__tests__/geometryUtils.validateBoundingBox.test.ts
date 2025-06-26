import { validateBoundingBox } from "../geometryUtils";

describe("validateBoundingBox", () => {
  it("should enforce minimum dimensions", () => {
    const boundingBox = { x: 10, y: 10, width: 5, height: 8 };
    const minWidth = 15;
    const minHeight = 12;

    const result = validateBoundingBox(
      boundingBox,
      100,
      100,
      minWidth,
      minHeight
    );

    expect(result.width).toBe(minWidth);
    expect(result.height).toBe(minHeight);
  });

  it("should keep bounding box within image boundaries", () => {
    const boundingBox = { x: -5, y: -3, width: 20, height: 15 };
    const imageWidth = 100;
    const imageHeight = 80;

    const result = validateBoundingBox(boundingBox, imageWidth, imageHeight);

    expect(result.x).toBe(0); // Clamped to 0
    expect(result.y).toBe(0); // Clamped to 0
    expect(result.width).toBe(20); // Enforced to default minimum (20)
    expect(result.height).toBe(20); // Enforced to default minimum (20)
  });

  it("should prevent bounding box from exceeding image boundaries", () => {
    const boundingBox = { x: 80, y: 70, width: 30, height: 25 };
    const imageWidth = 100;
    const imageHeight = 80;

    const result = validateBoundingBox(boundingBox, imageWidth, imageHeight);

    // First, minimum dimensions are enforced (width=30, height=25 both > 20)
    // Then position is adjusted: x = Math.max(0, Math.min(80, 100-30)) = 70
    expect(result.x).toBe(70); // Adjusted to fit within image
    expect(result.y).toBe(55); // Math.max(0, Math.min(70, 80-25)) = 55
    expect(result.width).toBe(30); // Width unchanged (already > minWidth)
    expect(result.height).toBe(25); // Height unchanged (already > minHeight)
  });

  it("should handle bounding box completely outside image", () => {
    const boundingBox = { x: 150, y: 120, width: 20, height: 15 };
    const imageWidth = 100;
    const imageHeight = 80;
    const minWidth = 10;
    const minHeight = 8;

    const result = validateBoundingBox(
      boundingBox,
      imageWidth,
      imageHeight,
      minWidth,
      minHeight
    );

    // First enforce minimum dimensions (20 > 10, 15 > 8, so no change)
    // Then adjust position: x = Math.max(0, Math.min(150, 100-20)) = 80
    expect(result.x).toBe(80); // imageWidth - width = 100 - 20
    expect(result.y).toBe(65); // imageHeight - height = 80 - 15
    expect(result.width).toBe(20); // Original width (already > minWidth)
    expect(result.height).toBe(15); // Original height (already > minHeight)
  });

  it("should handle zero-sized image gracefully", () => {
    const boundingBox = { x: 5, y: 5, width: 10, height: 8 };
    const imageWidth = 0;
    const imageHeight = 0;
    const minWidth = 20;
    const minHeight = 15;

    const result = validateBoundingBox(
      boundingBox,
      imageWidth,
      imageHeight,
      minWidth,
      minHeight
    );

    // First enforce minimum dimensions
    // Then adjust position: x = Math.max(0, Math.min(5, 0-20)) = 0
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(0); // Final width adjustment: 0 - 0 = 0
    expect(result.height).toBe(0); // Final height adjustment: 0 - 0 = 0
  });
}); 