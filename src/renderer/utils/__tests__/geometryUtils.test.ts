import {
  rotatePoint,
  transformMouseDeltaToFrameLocal,
  calculateRotatedCorners,
  Point
} from '../geometryUtils';

describe('Phase 1: Core Geometry Utilities', () => {
  
  describe('rotatePoint', () => {
    it('should handle 0 degree rotation (no change)', () => {
      const point: Point = { x: 10, y: 5 };
      const result = rotatePoint(point, 0);
      
      expect(result.x).toBeCloseTo(10, 10);
      expect(result.y).toBeCloseTo(5, 10);
    });

    it('should handle 90 degree clockwise rotation', () => {
      const point: Point = { x: 10, y: 0 };
      const result = rotatePoint(point, 90);
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(10, 10);
    });

    it('should handle 180 degree rotation', () => {
      const point: Point = { x: 10, y: 5 };
      const result = rotatePoint(point, 180);
      
      expect(result.x).toBeCloseTo(-10, 10);
      expect(result.y).toBeCloseTo(-5, 10);
    });

    it('should handle 270 degree rotation', () => {
      const point: Point = { x: 10, y: 0 };
      const result = rotatePoint(point, 270);
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(-10, 10);
    });

    it('should handle 45 degree rotation', () => {
      const point: Point = { x: 10, y: 0 };
      const result = rotatePoint(point, 45);
      
      const expected = 10 / Math.sqrt(2); // 10 * cos(45°) = 10 * sin(45°)
      expect(result.x).toBeCloseTo(expected, 10);
      expect(result.y).toBeCloseTo(expected, 10);
    });

    it('should handle negative angles', () => {
      const point: Point = { x: 10, y: 0 };
      const result = rotatePoint(point, -90);
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(-10, 10);
    });

    it('should handle angles greater than 360 degrees', () => {
      const point: Point = { x: 10, y: 0 };
      const result = rotatePoint(point, 450); // 450° = 90°
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(10, 10);
    });

    it('should handle origin point', () => {
      const point: Point = { x: 0, y: 0 };
      const result = rotatePoint(point, 45);
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(0, 10);
    });
  });

  describe('transformMouseDeltaToFrameLocal', () => {
    it('should handle 0 degree rotation (no transformation)', () => {
      const mouseDelta: Point = { x: 10, y: 5 };
      const result = transformMouseDeltaToFrameLocal(mouseDelta, 0);
      
      expect(result.x).toBeCloseTo(10, 10);
      expect(result.y).toBeCloseTo(5, 10);
    });

    it('should correctly inverse 90 degree rotation', () => {
      const mouseDelta: Point = { x: 10, y: 0 };
      const result = transformMouseDeltaToFrameLocal(mouseDelta, 90);
      
      // For 90° frame rotation, global +x should map to local +y
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(-10, 10);
    });

    it('should correctly inverse 180 degree rotation', () => {
      const mouseDelta: Point = { x: 10, y: 5 };
      const result = transformMouseDeltaToFrameLocal(mouseDelta, 180);
      
      expect(result.x).toBeCloseTo(-10, 10);
      expect(result.y).toBeCloseTo(-5, 10);
    });

    it('should correctly inverse 270 degree rotation', () => {
      const mouseDelta: Point = { x: 10, y: 0 };
      const result = transformMouseDeltaToFrameLocal(mouseDelta, 270);
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(10, 10);
    });

    it('should correctly inverse 45 degree rotation', () => {
      const mouseDelta: Point = { x: 10, y: 0 };
      const result = transformMouseDeltaToFrameLocal(mouseDelta, 45);
      
      const expected = 10 / Math.sqrt(2);
      expect(result.x).toBeCloseTo(expected, 10);
      expect(result.y).toBeCloseTo(-expected, 10);
    });

    it('should be inverse of rotatePoint', () => {
      const originalDelta: Point = { x: 15, y: 8 };
      const rotation = 37.5;
      
      // Transform to frame local, then rotate back - should get original
      const localDelta = transformMouseDeltaToFrameLocal(originalDelta, rotation);
      const backToGlobal = rotatePoint(localDelta, rotation);
      
      expect(backToGlobal.x).toBeCloseTo(originalDelta.x, 10);
      expect(backToGlobal.y).toBeCloseTo(originalDelta.y, 10);
    });

    it('should handle negative rotation angles', () => {
      const mouseDelta: Point = { x: 10, y: 0 };
      const result = transformMouseDeltaToFrameLocal(mouseDelta, -90);
      
      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(10, 10);
    });
  });

  describe('calculateRotatedCorners', () => {
    it('should handle 0 degree rotation (axis-aligned rectangle)', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners = calculateRotatedCorners(center, width, height, 0);
      
      // Expected corners for axis-aligned rectangle
      expect(corners).toHaveLength(4);
      expect(corners[0].x).toBeCloseTo(80, 10);  // topLeft.x = 100 - 20
      expect(corners[0].y).toBeCloseTo(90, 10);  // topLeft.y = 100 - 10
      expect(corners[1].x).toBeCloseTo(120, 10); // topRight.x = 100 + 20
      expect(corners[1].y).toBeCloseTo(90, 10);  // topRight.y = 100 - 10
      expect(corners[2].x).toBeCloseTo(120, 10); // bottomRight.x = 100 + 20
      expect(corners[2].y).toBeCloseTo(110, 10); // bottomRight.y = 100 + 10
      expect(corners[3].x).toBeCloseTo(80, 10);  // bottomLeft.x = 100 - 20
      expect(corners[3].y).toBeCloseTo(110, 10); // bottomLeft.y = 100 + 10
    });

    it('should handle 90 degree rotation', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners = calculateRotatedCorners(center, width, height, 90);
      
      // After 90° clockwise rotation:
      // Original local corners: [(-20, -10), (20, -10), (20, 10), (-20, 10)]
      // After rotation (x' = -y, y' = x): [(10, -20), (10, 20), (-10, 20), (-10, -20)]
      // With center (100, 100): [(110, 80), (110, 120), (90, 120), (90, 80)]
      expect(corners[0].x).toBeCloseTo(110, 10);  // topLeft after rotation
      expect(corners[0].y).toBeCloseTo(80, 10);
      expect(corners[1].x).toBeCloseTo(110, 10);  // topRight after rotation
      expect(corners[1].y).toBeCloseTo(120, 10);
      expect(corners[2].x).toBeCloseTo(90, 10);   // bottomRight after rotation
      expect(corners[2].y).toBeCloseTo(120, 10);
      expect(corners[3].x).toBeCloseTo(90, 10);   // bottomLeft after rotation
      expect(corners[3].y).toBeCloseTo(80, 10);
    });

    it('should handle 180 degree rotation', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners = calculateRotatedCorners(center, width, height, 180);
      
      // 180° rotation flips both x and y
      expect(corners[0].x).toBeCloseTo(120, 10); // topLeft becomes bottomRight
      expect(corners[0].y).toBeCloseTo(110, 10);
      expect(corners[1].x).toBeCloseTo(80, 10);  // topRight becomes bottomLeft
      expect(corners[1].y).toBeCloseTo(110, 10);
      expect(corners[2].x).toBeCloseTo(80, 10);  // bottomRight becomes topLeft
      expect(corners[2].y).toBeCloseTo(90, 10);
      expect(corners[3].x).toBeCloseTo(120, 10); // bottomLeft becomes topRight
      expect(corners[3].y).toBeCloseTo(90, 10);
    });

    it('should handle 45 degree rotation', () => {
      const center: Point = { x: 0, y: 0 }; // Use origin for easier calculation
      const width = 20;
      const height = 20; // Square for symmetry
      const corners = calculateRotatedCorners(center, width, height, 45);
      
      // For a square rotated 45°, corners should be at distance sqrt(2)*10 from center
      const expectedDistance = Math.sqrt(2) * 10;
      
      corners.forEach(corner => {
        const distance = Math.sqrt(corner.x * corner.x + corner.y * corner.y);
        expect(distance).toBeCloseTo(expectedDistance, 10);
      });
    });

    it('should maintain center position', () => {
      const center: Point = { x: 150, y: 75 };
      const width = 60;
      const height = 40;
      const corners = calculateRotatedCorners(center, width, height, 37.5);
      
      // Calculate centroid of corners - should equal original center
      const centroid: Point = {
        x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
        y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4
      };
      
      expect(centroid.x).toBeCloseTo(center.x, 10);
      expect(centroid.y).toBeCloseTo(center.y, 10);
    });

    it('should handle negative rotation angles', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners1 = calculateRotatedCorners(center, width, height, -90);
      const corners2 = calculateRotatedCorners(center, width, height, 270);
      
      // -90° should equal 270°
      for (let i = 0; i < 4; i++) {
        expect(corners1[i].x).toBeCloseTo(corners2[i].x, 10);
        expect(corners1[i].y).toBeCloseTo(corners2[i].y, 10);
      }
    });

    it('should handle zero dimensions', () => {
      const center: Point = { x: 100, y: 100 };
      const corners = calculateRotatedCorners(center, 0, 0, 45);
      
      // All corners should be at the center
      corners.forEach(corner => {
        expect(corner.x).toBeCloseTo(center.x, 10);
        expect(corner.y).toBeCloseTo(center.y, 10);
      });
    });

    it('should return corners in correct order [topLeft, topRight, bottomRight, bottomLeft]', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners = calculateRotatedCorners(center, width, height, 0);
      
      // For 0° rotation, verify order
      expect(corners[0].x).toBeLessThan(corners[1].x); // topLeft.x < topRight.x
      expect(corners[0].y).toEqual(corners[1].y);      // topLeft.y = topRight.y
      expect(corners[1].x).toEqual(corners[2].x);      // topRight.x = bottomRight.x
      expect(corners[1].y).toBeLessThan(corners[2].y); // topRight.y < bottomRight.y
      expect(corners[2].x).toBeGreaterThan(corners[3].x); // bottomRight.x > bottomLeft.x
      expect(corners[2].y).toEqual(corners[3].y);      // bottomRight.y = bottomLeft.y
      expect(corners[3].x).toEqual(corners[0].x);      // bottomLeft.x = topLeft.x
      expect(corners[3].y).toBeGreaterThan(corners[0].y); // bottomLeft.y > topLeft.y
    });
  });

  describe('Integration tests', () => {
    it('should work together for a complete transformation cycle', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 60;
      const height = 40;
      const rotation = 30;
      
      // Calculate rotated corners
      const corners = calculateRotatedCorners(center, width, height, rotation);
      
      // Simulate a mouse delta in global coordinates
      const globalMouseDelta: Point = { x: 10, y: 5 };
      
      // Transform to frame local coordinates
      const localDelta = transformMouseDeltaToFrameLocal(globalMouseDelta, rotation);
      
      // Verify the transformation is consistent
      const backToGlobal = rotatePoint(localDelta, rotation);
      expect(backToGlobal.x).toBeCloseTo(globalMouseDelta.x, 10);
      expect(backToGlobal.y).toBeCloseTo(globalMouseDelta.y, 10);
      
      // Verify corners form a proper rectangle in local space
      // (This is more of a sanity check that our corner calculation is reasonable)
      expect(corners).toHaveLength(4);
      
      // Calculate the centroid to verify it matches the center
      const centroid: Point = {
        x: corners.reduce((sum, corner) => sum + corner.x, 0) / 4,
        y: corners.reduce((sum, corner) => sum + corner.y, 0) / 4
      };
      
      expect(centroid.x).toBeCloseTo(center.x, 10);
      expect(centroid.y).toBeCloseTo(center.y, 10);
    });
  });
}); 