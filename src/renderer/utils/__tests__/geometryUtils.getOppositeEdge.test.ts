import { getOppositeEdge } from "../geometryUtils";

describe("getOppositeEdge", () => {
  it("should return correct opposite edges", () => {
    expect(getOppositeEdge("top")).toBe("bottom");
    expect(getOppositeEdge("right")).toBe("left");
    expect(getOppositeEdge("bottom")).toBe("top");
    expect(getOppositeEdge("left")).toBe("right");
  });

  it("should be symmetric (opposite of opposite should be original)", () => {
    const edges: ("top" | "right" | "bottom" | "left")[] = [
      "top",
      "right",
      "bottom",
      "left",
    ];

    edges.forEach((edge) => {
      const opposite = getOppositeEdge(edge);
      const oppositeOfOpposite = getOppositeEdge(opposite);
      expect(oppositeOfOpposite).toBe(edge);
    });
  });
}); 