import { getMousePositionRelativeToSVG } from "../geometryUtils";

describe("getMousePositionRelativeToSVG", () => {
  let mockSVGElement: Partial<SVGSVGElement>;
  let mockEvent: Partial<React.MouseEvent>;

  beforeEach(() => {
    mockSVGElement = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 100,
        top: 50,
        width: 300,
        height: 200,
      }),
    };

    mockEvent = {
      clientX: 150,
      clientY: 75,
    };
  });

  it("should calculate correct relative position", () => {
    const result = getMousePositionRelativeToSVG(
      mockEvent as React.MouseEvent,
      mockSVGElement as SVGSVGElement
    );

    expect(result.x).toBe(50); // 150 - 100
    expect(result.y).toBe(25); // 75 - 50
  });

  it("should return origin when SVG element is null", () => {
    const result = getMousePositionRelativeToSVG(
      mockEvent as React.MouseEvent,
      null
    );

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
}); 