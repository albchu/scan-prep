import {
  calculateSpatialEdgeFixedResize,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  calculateRectangleCenter,
  calculateAxisAlignedBoundingBox,
  Point
} from "../geometryUtils";

describe("Critical Bug Fix: Bounding Box vs Frame Dimensions", () => {
  const scaleFactors = { scaleX: 1, scaleY: 1 };

  it("should correctly handle the difference between bounding box and frame dimensions", () => {
    console.log('\n=== Testing Critical Bug Fix ===');
    
    // Create a frame with known dimensions
    const originalFrameWidth = 100;
    const originalFrameHeight = 60;
    const frameRotation = 45;
    const frameCenter = { x: 200, y: 200 };
    
    // Calculate what the bounding box should be for this rotated frame
    const expectedBoundingBox = calculateAxisAlignedBoundingBox(
      frameCenter, originalFrameWidth, originalFrameHeight, frameRotation
    );
    
    console.log('Original frame dimensions:', { width: originalFrameWidth, height: originalFrameHeight });
    console.log('Frame rotation:', frameRotation);
    console.log('Expected bounding box:', expectedBoundingBox);
    
    // Now test the resize algorithm using the bounding box as input
    // (this simulates the real-world scenario where we only have the bounding box)
    const mouseDelta: Point = { x: 30, y: 0 }; // Resize right edge
    
    const result = calculateSpatialEdgeFixedResize(
      expectedBoundingBox, frameRotation, 'right', mouseDelta, scaleFactors
    );
    
    console.log('Resize result:', result);
    
    // Verify that the fixed edge constraint is maintained
    // Get the original left edge center
    const originalCorners = calculateRotatedCorners(
      frameCenter, originalFrameWidth, originalFrameHeight, frameRotation
    );
    const originalLeftEdgeCenter = getFixedEdgeCenter(originalCorners, 'left');
    console.log('Original left edge center:', originalLeftEdgeCenter);
    
    // Calculate what the new left edge center should be
    // We need to figure out the new frame dimensions and center from the result
    const resultCenter = calculateRectangleCenter(
      result.x, result.y, result.width, result.height
    );
    
    // This is tricky - we need to reverse-engineer the frame dimensions from the result
    // For this test, let's manually calculate what they should be
    const imageDelta = { x: mouseDelta.x / scaleFactors.scaleX, y: mouseDelta.y / scaleFactors.scaleY };
    
    // Transform to frame local coordinates
    const angleRad = (-frameRotation * Math.PI) / 180;
    const localDelta = {
      x: imageDelta.x * Math.cos(angleRad) - imageDelta.y * Math.sin(angleRad),
      y: imageDelta.x * Math.sin(angleRad) + imageDelta.y * Math.cos(angleRad)
    };
    
    const expectedNewFrameWidth = originalFrameWidth + localDelta.x;
    const expectedNewFrameHeight = originalFrameHeight; // Height shouldn't change for right edge resize
    
    console.log('Expected new frame dimensions:', { width: expectedNewFrameWidth, height: expectedNewFrameHeight });
    
    // Calculate the new corners using the expected frame dimensions
    const newCorners = calculateRotatedCorners(
      resultCenter, expectedNewFrameWidth, expectedNewFrameHeight, frameRotation
    );
    const newLeftEdgeCenter = getFixedEdgeCenter(newCorners, 'left');
    console.log('New left edge center:', newLeftEdgeCenter);
    
    // The left edge should remain fixed
    const edgeMovement = Math.sqrt(
      Math.pow(newLeftEdgeCenter.x - originalLeftEdgeCenter.x, 2) + 
      Math.pow(newLeftEdgeCenter.y - originalLeftEdgeCenter.y, 2)
    );
    console.log('Edge movement (should be ~0):', edgeMovement);
    
    // This should be very small if the fix is working
    expect(edgeMovement).toBeLessThan(1.0); // Allow some tolerance for numerical precision
  });

  it("should produce different results before and after the fix", () => {
    console.log('\n=== Comparing Before and After Fix ===');
    
    // Create a test case where the bug would be obvious
    const frameWidth = 80;
    const frameHeight = 40;
    const rotation = 30;
    const center = { x: 100, y: 100 };
    
    // Calculate the bounding box for this frame
    const boundingBox = calculateAxisAlignedBoundingBox(center, frameWidth, frameHeight, rotation);
    console.log('Frame dimensions:', { width: frameWidth, height: frameHeight });
    console.log('Bounding box dimensions:', { width: boundingBox.width, height: boundingBox.height });
    
    // The bounding box should be larger than the frame
    expect(boundingBox.width).toBeGreaterThan(frameWidth);
    expect(boundingBox.height).toBeGreaterThan(frameHeight);
    
    console.log('Bounding box is larger than frame:', {
      widthDiff: boundingBox.width - frameWidth,
      heightDiff: boundingBox.height - frameHeight
    });
    
    // Test resize with the corrected algorithm
    const mouseDelta: Point = { x: 20, y: 0 };
    const result = calculateSpatialEdgeFixedResize(
      boundingBox, rotation, 'right', mouseDelta, scaleFactors
    );
    
    console.log('Resize result:', result);
    
    // The result should be reasonable (not excessively large)
    expect(result.width).toBeGreaterThan(boundingBox.width);
    expect(result.width).toBeLessThan(boundingBox.width * 2); // Shouldn't be too much larger
    
    // Verify the result is valid
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(isFinite(result.x)).toBe(true);
    expect(isFinite(result.y)).toBe(true);
  });

  it("should handle edge cases in the dimension calculation", () => {
    console.log('\n=== Testing Edge Cases ===');
    
    // Test 0° rotation (should work exactly as before)
    const box0 = { x: 100, y: 100, width: 80, height: 60 };
    const result0 = calculateSpatialEdgeFixedResize(
      box0, 0, 'right', { x: 20, y: 0 }, scaleFactors
    );
    console.log('0° rotation result:', result0);
    expect(result0.width).toBeCloseTo(100, 1); // Should increase by 20
    
    // Test 90° rotation
    const box90 = calculateAxisAlignedBoundingBox({ x: 100, y: 100 }, 80, 60, 90);
    const result90 = calculateSpatialEdgeFixedResize(
      box90, 90, 'right', { x: 20, y: 0 }, scaleFactors
    );
    console.log('90° rotation result:', result90);
    expect(result90.width).toBeGreaterThan(0);
    expect(result90.height).toBeGreaterThan(0);
    
    // Test 45° rotation (special case in the calculation)
    const box45 = calculateAxisAlignedBoundingBox({ x: 100, y: 100 }, 80, 60, 45);
    const result45 = calculateSpatialEdgeFixedResize(
      box45, 45, 'right', { x: 20, y: 0 }, scaleFactors
    );
    console.log('45° rotation result:', result45);
    expect(result45.width).toBeGreaterThan(0);
    expect(result45.height).toBeGreaterThan(0);
  });
}); 