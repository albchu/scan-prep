import { getMousePositionRelativeToElement } from "../geometryUtils";

describe("getMousePositionRelativeToElement", () => {
  let mockElement: Partial<HTMLElement>;
  let mockEvent: Partial<React.MouseEvent>;

  beforeEach(() => {
    mockElement = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        left: 200,
        top: 100,
        width: 400,
        height: 300,
      }),
    };

    mockEvent = {
      clientX: 250,
      clientY: 150,
    };
  });

  it("should calculate correct relative position", () => {
    const result = getMousePositionRelativeToElement(
      mockEvent as React.MouseEvent,
      mockElement as HTMLElement
    );

    expect(result.x).toBe(50); // 250 - 200
    expect(result.y).toBe(50); // 150 - 100
  });

  it("should return origin when element is null", () => {
    const result = getMousePositionRelativeToElement(
      mockEvent as React.MouseEvent,
      null
    );

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
}); 