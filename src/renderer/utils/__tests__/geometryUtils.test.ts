import {
  rotatePoint,
  transformMouseDeltaToFrameLocal,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  getResizeEdgeMapping,
  getOppositeEdge,
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

describe('Phase 2: Frame Analysis Functions', () => {
  
  describe('getFixedEdgeCenter', () => {
    it('should calculate correct edge centers for axis-aligned rectangle', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners = calculateRotatedCorners(center, width, height, 0);
      
      // For 0° rotation: corners are [topLeft, topRight, bottomRight, bottomLeft]
      // topLeft: (80, 90), topRight: (120, 90), bottomRight: (120, 110), bottomLeft: (80, 110)
      
      const topCenter = getFixedEdgeCenter(corners, 'top');
      expect(topCenter.x).toBeCloseTo(100, 10); // midpoint of (80, 90) and (120, 90)
      expect(topCenter.y).toBeCloseTo(90, 10);
      
      const rightCenter = getFixedEdgeCenter(corners, 'right');
      expect(rightCenter.x).toBeCloseTo(120, 10); // midpoint of (120, 90) and (120, 110)
      expect(rightCenter.y).toBeCloseTo(100, 10);
      
      const bottomCenter = getFixedEdgeCenter(corners, 'bottom');
      expect(bottomCenter.x).toBeCloseTo(100, 10); // midpoint of (120, 110) and (80, 110)
      expect(bottomCenter.y).toBeCloseTo(110, 10);
      
      const leftCenter = getFixedEdgeCenter(corners, 'left');
      expect(leftCenter.x).toBeCloseTo(80, 10); // midpoint of (80, 110) and (80, 90)
      expect(leftCenter.y).toBeCloseTo(100, 10);
    });

    it('should calculate correct edge centers for 90° rotated rectangle', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 40;
      const height = 20;
      const corners = calculateRotatedCorners(center, width, height, 90);
      
      // After 90° rotation, the rectangle is rotated clockwise
      // Original local corners: [(-20, -10), (20, -10), (20, 10), (-20, 10)]
      // After 90° rotation: [(10, -20), (10, 20), (-10, 20), (-10, -20)]
      // With center (100, 100): [(110, 80), (110, 120), (90, 120), (90, 80)]
      
      const topCenter = getFixedEdgeCenter(corners, 'top');
      expect(topCenter.x).toBeCloseTo(110, 10); // midpoint of (110, 80) and (110, 120)
      expect(topCenter.y).toBeCloseTo(100, 10);
      
      const rightCenter = getFixedEdgeCenter(corners, 'right');
      expect(rightCenter.x).toBeCloseTo(100, 10); // midpoint of (110, 120) and (90, 120)
      expect(rightCenter.y).toBeCloseTo(120, 10);
      
      const bottomCenter = getFixedEdgeCenter(corners, 'bottom');
      expect(bottomCenter.x).toBeCloseTo(90, 10); // midpoint of (90, 120) and (90, 80)
      expect(bottomCenter.y).toBeCloseTo(100, 10);
      
      const leftCenter = getFixedEdgeCenter(corners, 'left');
      expect(leftCenter.x).toBeCloseTo(100, 10); // midpoint of (90, 80) and (110, 80)
      expect(leftCenter.y).toBeCloseTo(80, 10);
    });

    it('should calculate correct edge centers for 45° rotated rectangle', () => {
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
      
      const edges: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
      edges.forEach(edge => {
        const edgeCenter = getFixedEdgeCenter(corners, edge);
        const distance = Math.sqrt(edgeCenter.x * edgeCenter.x + edgeCenter.y * edgeCenter.y);
        expect(distance).toBeCloseTo(expectedDistance, 10);
      });
    });
  });

  describe('getResizeEdgeMapping', () => {
    it('should map drag directions correctly for 0° rotation', () => {
      const rotation = 0;
      
      // For 0° rotation, drag directions should map directly to edges
      expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe('top');    // drag up
      expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe('right');   // drag right
      expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe('bottom');  // drag down
      expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe('left');   // drag left
    });

    it('should map drag directions correctly for 90° rotation', () => {
      const rotation = 90;
      
      // For 90° clockwise rotation, the mapping should rotate accordingly
      expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe('right');  // drag up -> right edge
      expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe('bottom');  // drag right -> bottom edge
      expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe('left');    // drag down -> left edge
      expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe('top');    // drag left -> top edge
    });

    it('should map drag directions correctly for 180° rotation', () => {
      const rotation = 180;
      
      // For 180° rotation, directions should be flipped
      expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe('bottom'); // drag up -> bottom edge
      expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe('left');    // drag right -> left edge
      expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe('top');     // drag down -> top edge
      expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe('right');  // drag left -> right edge
    });

    it('should map drag directions correctly for 270° rotation', () => {
      const rotation = 270;
      
      // For 270° rotation (or -90°)
      expect(getResizeEdgeMapping(rotation, { x: 0, y: -1 })).toBe('left');   // drag up -> left edge
      expect(getResizeEdgeMapping(rotation, { x: 1, y: 0 })).toBe('top');     // drag right -> top edge
      expect(getResizeEdgeMapping(rotation, { x: 0, y: 1 })).toBe('right');   // drag down -> right edge
      expect(getResizeEdgeMapping(rotation, { x: -1, y: 0 })).toBe('bottom'); // drag left -> bottom edge
    });

    it('should map diagonal drag directions correctly', () => {
      const rotation = 0;
      
      // Test diagonal directions - should map to the most aligned edge
      const sqrt2 = Math.sqrt(2);
      
      // Northeast direction should map to right or top (whichever is more aligned)
      const northeast = { x: 1/sqrt2, y: -1/sqrt2 };
      const neResult = getResizeEdgeMapping(rotation, northeast);
      expect(['top', 'right']).toContain(neResult);
      
      // Southeast direction
      const southeast = { x: 1/sqrt2, y: 1/sqrt2 };
      const seResult = getResizeEdgeMapping(rotation, southeast);
      expect(['right', 'bottom']).toContain(seResult);
      
      // Southwest direction
      const southwest = { x: -1/sqrt2, y: 1/sqrt2 };
      const swResult = getResizeEdgeMapping(rotation, southwest);
      expect(['bottom', 'left']).toContain(swResult);
      
      // Northwest direction
      const northwest = { x: -1/sqrt2, y: -1/sqrt2 };
      const nwResult = getResizeEdgeMapping(rotation, northwest);
      expect(['left', 'top']).toContain(nwResult);
    });

    it('should handle 45° rotation correctly', () => {
      const rotation = 45;
      
      // For 45° rotation, cardinal directions should map to diagonal edges
      // This is more complex, but we can test that it returns a valid edge
      const edges: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
      
      expect(edges).toContain(getResizeEdgeMapping(rotation, { x: 0, y: -1 }));
      expect(edges).toContain(getResizeEdgeMapping(rotation, { x: 1, y: 0 }));
      expect(edges).toContain(getResizeEdgeMapping(rotation, { x: 0, y: 1 }));
      expect(edges).toContain(getResizeEdgeMapping(rotation, { x: -1, y: 0 }));
    });

    it('should handle negative rotation angles', () => {
      const positiveRotation = 90;
      const negativeRotation = -270; // Equivalent to 90°
      
      const dragDirection = { x: 1, y: 0 };
      
      expect(getResizeEdgeMapping(positiveRotation, dragDirection))
        .toBe(getResizeEdgeMapping(negativeRotation, dragDirection));
    });

    it('should handle angles greater than 360°', () => {
      const rotation1 = 45;
      const rotation2 = 405; // 45° + 360°
      
      const dragDirection = { x: 1, y: 1 };
      
      expect(getResizeEdgeMapping(rotation1, dragDirection))
        .toBe(getResizeEdgeMapping(rotation2, dragDirection));
    });
  });

  describe('getOppositeEdge', () => {
    it('should return correct opposite edges', () => {
      expect(getOppositeEdge('top')).toBe('bottom');
      expect(getOppositeEdge('right')).toBe('left');
      expect(getOppositeEdge('bottom')).toBe('top');
      expect(getOppositeEdge('left')).toBe('right');
    });

    it('should be symmetric (opposite of opposite should be original)', () => {
      const edges: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
      
      edges.forEach(edge => {
        const opposite = getOppositeEdge(edge);
        const oppositeOfOpposite = getOppositeEdge(opposite);
        expect(oppositeOfOpposite).toBe(edge);
      });
    });
  });

  describe('Integration tests for Phase 2', () => {
    it('should work together for edge analysis workflow', () => {
      const center: Point = { x: 100, y: 100 };
      const width = 60;
      const height = 40;
      const rotation = 30;
      
      // Calculate rotated corners
      const corners = calculateRotatedCorners(center, width, height, rotation);
      
      // Test that we can get edge centers for all edges
      const edges: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
      const edgeCenters = edges.map(edge => ({
        edge,
        center: getFixedEdgeCenter(corners, edge)
      }));
      
      // Verify all edge centers are at reasonable distances from the frame center
      edgeCenters.forEach(({ edge, center: edgeCenter }) => {
        const distance = Math.sqrt(
          (edgeCenter.x - center.x) ** 2 + (edgeCenter.y - center.y) ** 2
        );
        
        // For the given dimensions, edge centers should be roughly 15-30 units from center
        expect(distance).toBeGreaterThan(10);
        expect(distance).toBeLessThan(50);
      });
      
      // Test edge mapping with various drag directions
      const dragDirections = [
        { x: 1, y: 0 },   // right
        { x: 0, y: 1 },   // down
        { x: -1, y: 0 },  // left
        { x: 0, y: -1 }   // up
      ];
      
      dragDirections.forEach(direction => {
        const mappedEdge = getResizeEdgeMapping(rotation, direction);
        expect(edges).toContain(mappedEdge);
        
        // Test that opposite edge function works
        const oppositeEdge = getOppositeEdge(mappedEdge);
        expect(edges).toContain(oppositeEdge);
        expect(oppositeEdge).not.toBe(mappedEdge);
      });
    });

    it('should maintain mathematical consistency across different rotations', () => {
      const center: Point = { x: 50, y: 50 };
      const width = 30;
      const height = 20;
      const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
      
      rotations.forEach(rotation => {
        const corners = calculateRotatedCorners(center, width, height, rotation);
        
        // Verify that the centroid of corners equals the original center
        const centroid: Point = {
          x: corners.reduce((sum, corner) => sum + corner.x, 0) / 4,
          y: corners.reduce((sum, corner) => sum + corner.y, 0) / 4
        };
        
        expect(centroid.x).toBeCloseTo(center.x, 10);
        expect(centroid.y).toBeCloseTo(center.y, 10);
        
        // Verify that edge centers are properly calculated
        const edges: ('top' | 'right' | 'bottom' | 'left')[] = ['top', 'right', 'bottom', 'left'];
        edges.forEach(edge => {
          const edgeCenter = getFixedEdgeCenter(corners, edge);
          
          // Edge center should be within reasonable bounds
          expect(edgeCenter.x).toBeGreaterThan(center.x - width);
          expect(edgeCenter.x).toBeLessThan(center.x + width);
          expect(edgeCenter.y).toBeGreaterThan(center.y - height);
          expect(edgeCenter.y).toBeLessThan(center.y + height);
        });
      });
    });
  });
}); 