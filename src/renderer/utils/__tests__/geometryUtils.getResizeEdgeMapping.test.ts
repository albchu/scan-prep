import { getResizeEdgeMapping } from "../geometryUtils";
import { FRAME_EDGES } from "@shared/types";

describe("getResizeEdgeMapping", () => {
  it("should map drag directions correctly for 0° rotation", () => {
    const rotation = 0;

    // For 0° rotation, drag directions should map directly to edges
    expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe("top"); // drag up
    expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe("right"); // drag right
    expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe("bottom"); // drag down
    expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe("left"); // drag left
  });

  it("should map drag directions correctly for 90° rotation", () => {
    const rotation = 90;

    // For 90° clockwise rotation, the mapping should rotate accordingly
    expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe("left"); // drag up -> left edge
    expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe("top"); // drag right -> top edge
    expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe("right"); // drag down -> right edge
    expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe("bottom"); // drag left -> bottom edge
  });

  it("should map drag directions correctly for 180° rotation", () => {
    const rotation = 180;

    // For 180° rotation, directions should be flipped
    expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe("bottom"); // drag up -> bottom edge
    expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe("left"); // drag right -> left edge
    expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe("top"); // drag down -> top edge
    expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe("right"); // drag left -> right edge
  });

  it("should map drag directions correctly for 270° rotation", () => {
    const rotation = 270;

    // For 270° rotation (or -90°)
    expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe("right"); // drag up -> right edge
    expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe("bottom"); // drag right -> bottom edge
    expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe("left"); // drag down -> left edge
    expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe("top"); // drag left -> top edge
  });

  it("should map diagonal drag directions correctly", () => {
    const rotation = 0;

    // Test diagonal directions - should map to the most aligned edge
    const sqrt2 = Math.sqrt(2);

    // Northeast direction should map to right or top (whichever is more aligned)
    const northeast = { x: 1 / sqrt2, y: -1 / sqrt2 };
    const neResult = getResizeEdgeMapping(rotation, northeast);
    expect(["top", "right"]).toContain(neResult);

    // Southeast direction
    const southeast = { x: 1 / sqrt2, y: 1 / sqrt2 };
    const seResult = getResizeEdgeMapping(rotation, southeast);
    expect(["right", "bottom"]).toContain(seResult);

    // Southwest direction
    const southwest = { x: -1 / sqrt2, y: 1 / sqrt2 };
    const swResult = getResizeEdgeMapping(rotation, southwest);
    expect(["bottom", "left"]).toContain(swResult);

    // Northwest direction
    const northwest = { x: -1 / sqrt2, y: -1 / sqrt2 };
    const nwResult = getResizeEdgeMapping(rotation, northwest);
    expect(["left", "top"]).toContain(nwResult);
  });

  it("should handle 45° rotation correctly", () => {
    const rotation = 45;

    // For 45° rotation, cardinal directions should map to diagonal edges
    // This is more complex, but we can test that it returns a valid edge
    const edges = FRAME_EDGES;

    expect(edges).toContain(getResizeEdgeMapping(rotation, { x: 0, y: -1 }));
    expect(edges).toContain(getResizeEdgeMapping(rotation, { x: 1, y: 0 }));
    expect(edges).toContain(getResizeEdgeMapping(rotation, { x: 0, y: 1 }));
    expect(edges).toContain(getResizeEdgeMapping(rotation, { x: -1, y: 0 }));
  });

  it("should handle negative rotation angles", () => {
    const positiveRotation = 90;
    const negativeRotation = -270; // Equivalent to 90°

    const dragDirection = { x: 1, y: 0 };

    expect(getResizeEdgeMapping(positiveRotation, dragDirection)).toBe(
      getResizeEdgeMapping(negativeRotation, dragDirection)
    );
  });

  it("should handle angles greater than 360°", () => {
    const rotation1 = 45;
    const rotation2 = 405; // 45° + 360°

    const dragDirection = { x: 1, y: 1 };

    expect(getResizeEdgeMapping(rotation1, dragDirection)).toBe(
      getResizeEdgeMapping(rotation2, dragDirection)
    );
  });
}); 