import { normalizeAngle } from "../geometryUtils";

describe("normalizeAngle", () => {
  it("should keep angles within -180 to 180 range unchanged", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(-90)).toBe(-90);
    expect(normalizeAngle(180)).toBe(180);
    expect(normalizeAngle(-180)).toBe(-180);
  });

  it("should normalize angles greater than 180", () => {
    expect(normalizeAngle(270)).toBe(-90);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
  });

  it("should normalize angles less than -180", () => {
    expect(normalizeAngle(-270)).toBe(90);
    expect(normalizeAngle(-360)).toBe(0);
    expect(normalizeAngle(-450)).toBe(-90);
  });

  it("should handle very large angles", () => {
    expect(normalizeAngle(720)).toBe(0);
    expect(normalizeAngle(1080)).toBe(0);
    expect(normalizeAngle(-720)).toBe(0);
  });
}); 