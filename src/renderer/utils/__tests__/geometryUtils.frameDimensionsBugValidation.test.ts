import {
  calculateSpatialEdgeFixedResize,
  calculateAxisAlignedBoundingBox,
  transformMouseDeltaToFrameLocal,
  Point,
  ScaleFactors
} from "../geometryUtils";

/**
 * Frame Dimensions Bug Validation Test Suite
 * 
 * This test suite validates the frame dimensions architecture bug.
 * 
 * CURRENT STATE: All tests should FAIL due to the bug
 * AFTER FIX: All tests should PASS
 * 
 * The bug occurs because the resize algorithm uses bounding box dimensions
 * instead of actual frame dimensions for rotated frames.
 */
describe("Frame Dimensions Bug Validation", () => {
  const scaleFactors: ScaleFactors = { scaleX: 1, scaleY: 1 };

  describe("Core Issue: Bounding Box vs Frame Dimensions", () => {
    it("should demonstrate the fundamental difference between frame and bounding box dimensions", () => {
      // A 100×60 frame rotated 45° should have different frame vs bounding box dimensions
      const frameWidth = 100;
      const frameHeight = 60;
      const rotation = 45;
      const center = { x: 200, y: 200 };
      
      const boundingBox = calculateAxisAlignedBoundingBox(
        center, frameWidth, frameHeight, rotation
      );
      
      // The frame dimensions should remain 100×60
      const actualFrameDimensions = { width: frameWidth, height: frameHeight };
      
      // The bounding box should be larger (approximately 113×113)
      expect(boundingBox.width).toBeGreaterThan(frameWidth);
      expect(boundingBox.height).toBeGreaterThan(frameHeight);
      expect(Math.abs(boundingBox.width - boundingBox.height)).toBeLessThan(0.01); // Should be square
      
      // This is the core issue: current algorithm confuses these two values
      console.log('Frame dimensions:', actualFrameDimensions);
      console.log('Bounding box dimensions:', { width: boundingBox.width, height: boundingBox.height });
    });
  });

  describe("Inward Resize Bug Validation", () => {
    it("should correctly shrink a rotated frame when resizing inward", () => {
      // Setup: 100×60 frame rotated 45°
      const originalFrameWidth = 100;
      const originalFrameHeight = 60;
      const rotation = 45;
      const center = { x: 200, y: 200 };
      
      const originalBoundingBox = calculateAxisAlignedBoundingBox(
        center, originalFrameWidth, originalFrameHeight, rotation
      );
      
      // User drags inward by 30px (this should make the frame smaller)
      const inwardMouseDelta: Point = { x: -30, y: 0 };
      
      // Expected behavior: frame should shrink
      // const expectedNewWidth = originalFrameWidth + localDelta.x; // Should be ~78.79
      // const expectedNewHeight = originalFrameHeight; // Should remain 60
      
      // CURRENT BUG: Algorithm uses wrong baseline dimensions
      const result = calculateSpatialEdgeFixedResize(
        originalBoundingBox,
        rotation,
        'right',
        inwardMouseDelta,
        scaleFactors,
        Infinity,
        Infinity
      );
      
      // Calculate what the actual frame dimensions would be if this were correct
      // This is complex because we need to reverse-engineer from the result
      // For now, we'll check if the area decreased (basic expectation)
      const originalArea = originalBoundingBox.width * originalBoundingBox.height;
      const resultArea = result.width * result.height;
      
      // ❌ THIS TEST SHOULD FAIL with current implementation
      // The frame should get smaller (area should decrease significantly)
      expect(resultArea).toBeLessThan(originalArea * 0.9); // Should be at least 10% smaller
      
      console.log('Original bounding box area:', originalArea);
      console.log('Result bounding box area:', resultArea);
      console.log('Area change:', resultArea - originalArea);
      console.log('Expected: Area should decrease significantly');
    });

    it("should handle inward resize consistently across different rotation angles", () => {
      const testAngles = [0, 15, 30, 45, 60, 90, 135, 180, 270];
      const originalFrameWidth = 80;
      const originalFrameHeight = 50;
      const center = { x: 100, y: 100 };
      
      // Inward resize delta
      const inwardDelta: Point = { x: -20, y: 0 }; // Should make frame narrower
      
      testAngles.forEach(angle => {
        const originalBoundingBox = calculateAxisAlignedBoundingBox(
          center, originalFrameWidth, originalFrameHeight, angle
        );
        
        const result = calculateSpatialEdgeFixedResize(
          originalBoundingBox,
          angle,
          'right',
          inwardDelta,
          scaleFactors,
          Infinity,
          Infinity
        );
        
        const originalArea = originalBoundingBox.width * originalBoundingBox.height;
        const resultArea = result.width * result.height;
        const areaChangePercent = ((resultArea - originalArea) / originalArea) * 100;
        
        // ❌ THIS TEST SHOULD FAIL for some angles (especially 45°)
        // All angles should consistently make the frame smaller
        expect(areaChangePercent).toBeLessThan(-5); // Should decrease by at least 5%
        
        console.log(`Angle ${angle}°: Area change ${areaChangePercent.toFixed(1)}%`);
      });
    });

    it("should maintain predictable resize behavior regardless of frame aspect ratio", () => {
      const testFrames = [
        { width: 100, height: 60, name: "Wide rectangle" },
        { width: 60, height: 100, name: "Tall rectangle" },
        { width: 80, height: 80, name: "Square" },
        { width: 120, height: 40, name: "Very wide" },
        { width: 40, height: 120, name: "Very tall" }
      ];
      
      const rotation = 45; // Most problematic angle
      const center = { x: 150, y: 150 };
      const inwardDelta: Point = { x: -25, y: 0 };
      
      testFrames.forEach(frame => {
        const originalBoundingBox = calculateAxisAlignedBoundingBox(
          center, frame.width, frame.height, rotation
        );
        
        const result = calculateSpatialEdgeFixedResize(
          originalBoundingBox,
          rotation,
          'right',
          inwardDelta,
          scaleFactors,
          Infinity,
          Infinity
        );
        
        const originalArea = originalBoundingBox.width * originalBoundingBox.height;
        const resultArea = result.width * result.height;
        
        // ❌ THIS TEST SHOULD FAIL for most frame types
        // All frames should shrink predictably
        expect(resultArea).toBeLessThan(originalArea);
        
        console.log(`${frame.name} (${frame.width}×${frame.height}): ${resultArea < originalArea ? 'SHRUNK' : 'GREW'}`);
      });
    });
  });

  describe("Outward Resize Consistency", () => {
    it("should correctly grow a rotated frame when resizing outward", () => {
      // Setup: 100×60 frame rotated 45°
      const originalFrameWidth = 100;
      const originalFrameHeight = 60;
      const rotation = 45;
      const center = { x: 200, y: 200 };
      
      const originalBoundingBox = calculateAxisAlignedBoundingBox(
        center, originalFrameWidth, originalFrameHeight, rotation
      );
      
      // User drags outward by 30px (this should make the frame larger)
      const outwardMouseDelta: Point = { x: 30, y: 0 };
      
      const result = calculateSpatialEdgeFixedResize(
        originalBoundingBox,
        rotation,
        'right',
        outwardMouseDelta,
        scaleFactors,
        Infinity,
        Infinity
      );
      
      const originalArea = originalBoundingBox.width * originalBoundingBox.height;
      const resultArea = result.width * result.height;
      
      // ✅ This might pass even with the bug (outward resize often works)
      expect(resultArea).toBeGreaterThan(originalArea);
      
      console.log('Outward resize - Original area:', originalArea);
      console.log('Outward resize - Result area:', resultArea);
      console.log('Outward resize - Area increase:', resultArea - originalArea);
    });
  });

  describe("Mathematical Accuracy Validation", () => {
    it("should produce mathematically correct frame dimensions for known inputs", () => {
      // Test case with known mathematical solution
      const frameWidth = 100;
      const frameHeight = 60;
      const rotation = 45;
      const center = { x: 0, y: 0 };
      
      const boundingBox = calculateAxisAlignedBoundingBox(
        center, frameWidth, frameHeight, rotation
      );
      
      // Apply a known resize delta
      const mouseDelta: Point = { x: -30, y: 0 }; // Inward resize
      const localDelta = transformMouseDeltaToFrameLocal(mouseDelta, rotation);
      
      // Mathematical expectation: new width should be frameWidth + localDelta.x
      const expectedNewWidth = frameWidth + localDelta.x; // ≈ 78.79
      const expectedNewHeight = frameHeight; // Should remain unchanged for right edge resize
      
      const result = calculateSpatialEdgeFixedResize(
        boundingBox,
        rotation,
        'right',
        mouseDelta,
        scaleFactors,
        Infinity,
        Infinity
      );
      
      // Calculate the expected new bounding box for comparison
      const expectedNewBoundingBox = calculateAxisAlignedBoundingBox(
        center, expectedNewWidth, expectedNewHeight, rotation
      );
      
      // ❌ THIS TEST SHOULD FAIL - the algorithm doesn't produce the mathematically correct result
      const widthError = Math.abs(result.width - expectedNewBoundingBox.width);
      const heightError = Math.abs(result.height - expectedNewBoundingBox.height);
      
      expect(widthError).toBeLessThan(1); // Should be very close
      expect(heightError).toBeLessThan(1); // Should be very close
      
      console.log('Expected new bounding box:', expectedNewBoundingBox);
      console.log('Actual result:', result);
      console.log('Width error:', widthError);
      console.log('Height error:', heightError);
    });

    it("should preserve the fixed edge position during resize", () => {
      // This test validates that the opposite edge stays in the same spatial position
      const frameWidth = 120;
      const frameHeight = 80;
      const rotation = 30;
      const center = { x: 100, y: 100 };
      
      const originalBoundingBox = calculateAxisAlignedBoundingBox(
        center, frameWidth, frameHeight, rotation
      );
      
      // Calculate the original left edge center (opposite of right edge)
      // This point should remain fixed during a right edge resize
      // (This is complex to calculate precisely, so we'll use a tolerance-based approach)
      
      const mouseDelta: Point = { x: 25, y: 0 }; // Resize right edge outward
      
      const result = calculateSpatialEdgeFixedResize(
        originalBoundingBox,
        rotation,
        'right',
        mouseDelta,
        scaleFactors,
        Infinity,
        Infinity
      );
      
      // The result should represent a frame where:
      // 1. The right edge moved outward
      // 2. The left edge stayed in the same spatial position
      // 3. The frame dimensions changed appropriately
      
      // For this test, we'll check that the resize operation produces a reasonable result
      // The specific validation would require implementing the fixed edge calculation
      
      expect(result.width).toBeGreaterThan(originalBoundingBox.width);
      expect(result.height).toBeGreaterThanOrEqual(originalBoundingBox.height * 0.95); // Allow small variation
      
      console.log('Fixed edge test - Original:', originalBoundingBox);
      console.log('Fixed edge test - Result:', result);
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle very small inward resize movements", () => {
      const frameWidth = 100;
      const frameHeight = 60;
      const rotation = 45;
      const center = { x: 200, y: 200 };
      
      const originalBoundingBox = calculateAxisAlignedBoundingBox(
        center, frameWidth, frameHeight, rotation
      );
      
      // Very small inward movement
      const smallInwardDelta: Point = { x: -2, y: 0 };
      
              const result = calculateSpatialEdgeFixedResize(
          originalBoundingBox,
          rotation,
          'right',
          smallInwardDelta,
          scaleFactors,
          Infinity,
          Infinity
        );
        
        const originalArea = originalBoundingBox.width * originalBoundingBox.height;
        const resultArea = result.width * result.height;
      
      // ❌ Even small movements should work correctly
      expect(resultArea).toBeLessThan(originalArea);
      
      console.log('Small movement test - Area change:', resultArea - originalArea);
    });

    it("should handle large inward resize movements without unexpected growth", () => {
      const frameWidth = 100;
      const frameHeight = 60;
      const rotation = 45;
      const center = { x: 200, y: 200 };
      
      const originalBoundingBox = calculateAxisAlignedBoundingBox(
        center, frameWidth, frameHeight, rotation
      );
      
      // Large inward movement (should hit minimum size constraints)
      const largeInwardDelta: Point = { x: -80, y: 0 };
      
              const result = calculateSpatialEdgeFixedResize(
          originalBoundingBox,
          rotation,
          'right',
          largeInwardDelta,
          scaleFactors,
          Infinity,
          Infinity,
          20, // minWidth
          20  // minHeight
        );
        
        const originalArea = originalBoundingBox.width * originalBoundingBox.height;
        const resultArea = result.width * result.height;
      
      // ❌ Large inward movements should never make the frame larger
      expect(resultArea).toBeLessThanOrEqual(originalArea);
      
      console.log('Large movement test - Original area:', originalArea);
      console.log('Large movement test - Result area:', resultArea);
      console.log('Large movement test - Area change:', resultArea - originalArea);
    });

    it("should work correctly for frames with extreme aspect ratios", () => {
      const testCases = [
        { width: 200, height: 20, name: "Very wide (10:1)" },
        { width: 20, height: 200, name: "Very tall (1:10)" },
        { width: 300, height: 30, name: "Extremely wide (10:1)" },
        { width: 30, height: 300, name: "Extremely tall (1:10)" }
      ];
      
      const rotation = 45;
      const center = { x: 150, y: 150 };
      const inwardDelta: Point = { x: -15, y: 0 };
      
      testCases.forEach(testCase => {
        const originalBoundingBox = calculateAxisAlignedBoundingBox(
          center, testCase.width, testCase.height, rotation
        );
        
        const result = calculateSpatialEdgeFixedResize(
          originalBoundingBox,
          rotation,
          'right',
          inwardDelta,
          scaleFactors,
          Infinity,
          Infinity
        );
        
        const originalArea = originalBoundingBox.width * originalBoundingBox.height;
        const resultArea = result.width * result.height;
        
        // ❌ Extreme aspect ratios should still work correctly
        expect(resultArea).toBeLessThan(originalArea);
        
        console.log(`${testCase.name}: ${resultArea < originalArea ? 'SHRUNK' : 'GREW'}`);
      });
    });
  });

  describe("Regression Prevention", () => {
    it("should not break non-rotated frame resize behavior", () => {
      // Ensure that 0° rotation still works correctly (regression test)
      const frameWidth = 100;
      const frameHeight = 60;
      const rotation = 0;
      const center = { x: 100, y: 100 };
      
      const originalBoundingBox = calculateAxisAlignedBoundingBox(
        center, frameWidth, frameHeight, rotation
      );
      
      const inwardDelta: Point = { x: -20, y: 0 };
      
      const result = calculateSpatialEdgeFixedResize(
        originalBoundingBox,
        rotation,
        'right',
        inwardDelta,
        scaleFactors,
        Infinity,
        Infinity
      );
      
      // For 0° rotation, this should work correctly even with the current implementation
      expect(result.width).toBeLessThan(originalBoundingBox.width);
      expect(result.height).toEqual(originalBoundingBox.height);
      
      console.log('0° rotation test - Original:', originalBoundingBox);
      console.log('0° rotation test - Result:', result);
    });
  });
});

/**
 * Helper function to run a comprehensive bug demonstration
 * This can be called manually to see the full extent of the bug
 */
export function demonstrateFrameDimensionsBug() {
  console.log('\n=== FRAME DIMENSIONS BUG DEMONSTRATION ===');
  
  const frameWidth = 100;
  const frameHeight = 60;
  const rotation = 45;
  const center = { x: 200, y: 200 };
  const scaleFactors = { scaleX: 1, scaleY: 1 };
  
  const boundingBox = calculateAxisAlignedBoundingBox(
    center, frameWidth, frameHeight, rotation
  );
  
  console.log('\n1. Setup:');
  console.log('   Actual frame dimensions:', { width: frameWidth, height: frameHeight });
  console.log('   Bounding box dimensions:', { width: boundingBox.width, height: boundingBox.height });
  console.log('   Rotation:', `${rotation}°`);
  
  const testDeltas = [
    { delta: { x: -10, y: 0 }, name: 'Small inward' },
    { delta: { x: -30, y: 0 }, name: 'Medium inward' },
    { delta: { x: -50, y: 0 }, name: 'Large inward' },
    { delta: { x: 20, y: 0 }, name: 'Outward (control)' }
  ];
  
  console.log('\n2. Resize tests:');
  testDeltas.forEach(test => {
    const result = calculateSpatialEdgeFixedResize(
      boundingBox, rotation, 'right', test.delta, scaleFactors,
      Infinity, Infinity
    );
    
    const originalArea = boundingBox.width * boundingBox.height;
    const resultArea = result.width * result.height;
    const areaChange = resultArea - originalArea;
    const behavior = areaChange > 0 ? '🐛 GREW' : '✅ SHRUNK';
    
    console.log(`   ${test.name}: Area change = ${areaChange.toFixed(1)} ${behavior}`);
  });
  
  console.log('\n3. Expected behavior:');
  console.log('   - All inward resizes should SHRINK the frame');
  console.log('   - Outward resizes should GROW the frame');
  console.log('   - The bug causes inward resizes to sometimes GROW the frame');
} 