import {
  calculateNewFrameCenter,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  getOppositeEdge,
  calculateRectangleCenter
} from "../geometryUtils";

describe("Center Calculation Bug Detection", () => {
  it("should correctly calculate new center when resizing right edge", () => {
    // Test case: simple 0° rotation first to verify basic logic
    console.log('\n=== Testing Right Edge Resize at 0° ===');
    
    const originalBox = { x: 100, y: 100, width: 200, height: 100 };
    const frameRotation = 0;
    const newWidth = 250; // Increased by 50
    const newHeight = 100; // Unchanged
    
    // Get original frame center and corners
    const originalCenter = calculateRectangleCenter(
      originalBox.x, originalBox.y, originalBox.width, originalBox.height
    );
    console.log('Original center:', originalCenter);
    
    const originalCorners = calculateRotatedCorners(
      originalCenter, originalBox.width, originalBox.height, frameRotation
    );
    console.log('Original corners:', originalCorners);
    
    // Get the fixed edge center (left edge when resizing right edge)
    const fixedEdge = getOppositeEdge('right'); // Should be 'left'
    const fixedEdgeCenter = getFixedEdgeCenter(originalCorners, fixedEdge);
    console.log('Fixed edge (left):', fixedEdge);
    console.log('Fixed edge center:', fixedEdgeCenter);
    
    // Calculate new frame center using the function
    const newFrameCenter = calculateNewFrameCenter(
      fixedEdgeCenter, newWidth, newHeight, frameRotation, 'right'
    );
    console.log('Calculated new center:', newFrameCenter);
    
    // For 0° rotation and right edge resize:
    // - Left edge should remain at x = 100
    // - New center should be at x = 100 + newWidth/2 = 100 + 125 = 225
    // - Y should remain the same
    const expectedNewCenter = {
      x: originalBox.x + newWidth / 2,
      y: originalCenter.y
    };
    console.log('Expected new center:', expectedNewCenter);
    
    // Verify the new center is correct
    expect(newFrameCenter.x).toBeCloseTo(expectedNewCenter.x, 5);
    expect(newFrameCenter.y).toBeCloseTo(expectedNewCenter.y, 5);
    
    // Double-check by verifying the left edge remains fixed
    const newCorners = calculateRotatedCorners(
      newFrameCenter, newWidth, newHeight, frameRotation
    );
    const newLeftEdgeCenter = getFixedEdgeCenter(newCorners, 'left');
    console.log('New left edge center:', newLeftEdgeCenter);
    
    expect(newLeftEdgeCenter.x).toBeCloseTo(fixedEdgeCenter.x, 5);
    expect(newLeftEdgeCenter.y).toBeCloseTo(fixedEdgeCenter.y, 5);
  });

  it("should correctly calculate new center when resizing right edge at 45°", () => {
    console.log('\n=== Testing Right Edge Resize at 45° ===');
    
    const originalBox = { x: 100, y: 100, width: 200, height: 100 };
    const frameRotation = 45;
    const newWidth = 250; // Increased by 50
    const newHeight = 100; // Unchanged
    
    // Get original frame center and corners
    const originalCenter = calculateRectangleCenter(
      originalBox.x, originalBox.y, originalBox.width, originalBox.height
    );
    console.log('Original center:', originalCenter);
    
    const originalCorners = calculateRotatedCorners(
      originalCenter, originalBox.width, originalBox.height, frameRotation
    );
    console.log('Original corners:', originalCorners);
    
    // Get the fixed edge center (left edge when resizing right edge)
    const fixedEdge = getOppositeEdge('right'); // Should be 'left'
    const fixedEdgeCenter = getFixedEdgeCenter(originalCorners, fixedEdge);
    console.log('Fixed edge (left):', fixedEdge);
    console.log('Fixed edge center:', fixedEdgeCenter);
    
    // Calculate new frame center using the function
    const newFrameCenter = calculateNewFrameCenter(
      fixedEdgeCenter, newWidth, newHeight, frameRotation, 'right'
    );
    console.log('Calculated new center:', newFrameCenter);
    
    // Verify the left edge remains fixed
    const newCorners = calculateRotatedCorners(
      newFrameCenter, newWidth, newHeight, frameRotation
    );
    const newLeftEdgeCenter = getFixedEdgeCenter(newCorners, 'left');
    console.log('New left edge center:', newLeftEdgeCenter);
    
    const edgeMovement = Math.sqrt(
      Math.pow(newLeftEdgeCenter.x - fixedEdgeCenter.x, 2) + 
      Math.pow(newLeftEdgeCenter.y - fixedEdgeCenter.y, 2)
    );
    console.log('Edge movement:', edgeMovement);
    
    expect(edgeMovement).toBeLessThan(0.01);
  });

  it("should verify the mathematical logic of calculateNewFrameCenter", () => {
    console.log('\n=== Verifying Mathematical Logic ===');
    
    // The function currently uses:
    // localDistances[resizeEdge] 
    // But should it use localDistances[oppositeEdge]?
    
    // Let's manually calculate what the logic should be:
    const fixedEdgeCenter = { x: 100, y: 150 }; // Left edge center
    const newWidth = 250;
    const newHeight = 100;
    const frameRotation = 0;
    const resizeEdge = 'right';
    
    console.log('Fixed edge center:', fixedEdgeCenter);
    console.log('New dimensions:', { width: newWidth, height: newHeight });
    console.log('Resize edge:', resizeEdge);
    
    // Manual calculation:
    // If we're resizing the right edge and the left edge is fixed,
    // the new center should be: fixedEdgeCenter + (distance from left edge to center)
    // Distance from left edge to center in local coords = { x: newWidth/2, y: 0 }
    // For 0° rotation, this transforms to the same values in global coords
    
    const expectedCenter = {
      x: fixedEdgeCenter.x + newWidth / 2,
      y: fixedEdgeCenter.y
    };
    console.log('Manually calculated expected center:', expectedCenter);
    
    // Now test the function
    const calculatedCenter = calculateNewFrameCenter(
      fixedEdgeCenter, newWidth, newHeight, frameRotation, resizeEdge
    );
    console.log('Function calculated center:', calculatedCenter);
    
    expect(calculatedCenter.x).toBeCloseTo(expectedCenter.x, 5);
    expect(calculatedCenter.y).toBeCloseTo(expectedCenter.y, 5);
  });

  it("should identify the potential bug in calculateNewFrameCenter", () => {
    console.log('\n=== Bug Investigation ===');
    
    // The current implementation uses:
    // const localDistance = localDistances[resizeEdge];
    // 
    // But logically, if we're resizing the right edge and the left edge is fixed,
    // we need the distance from the FIXED edge (left) to the center, not from the 
    // RESIZE edge (right) to the center.
    
    const fixedEdgeCenter = { x: 100, y: 150 };
    const newWidth = 250;
    const newHeight = 100;
    const resizeEdge = 'right';
    
    // Current implementation logic:
    const localDistances = {
      'top': {x: 0, y: -newHeight/2},
      'right': {x: newWidth/2, y: 0},
      'bottom': {x: 0, y: newHeight/2}, 
      'left': {x: -newWidth/2, y: 0}
    };
    
    const currentLogicDistance = localDistances[resizeEdge]; // Uses 'right'
    console.log('Current logic uses distance for resize edge (right):', currentLogicDistance);
    
    // What the logic should be:
    const oppositeEdge = getOppositeEdge(resizeEdge); // 'left'
    const correctLogicDistance = localDistances[oppositeEdge]; // Uses 'left'
    console.log('Correct logic should use distance for fixed edge (left):', correctLogicDistance);
    
    // But wait - the distances are from center to edge, so we need to negate for edge to center
    const correctedDistance = {
      x: -correctLogicDistance.x,
      y: -correctLogicDistance.y
    };
    console.log('Corrected distance (from fixed edge to center):', correctedDistance);
    
    // Test both approaches
    const currentResult = {
      x: fixedEdgeCenter.x + currentLogicDistance.x,
      y: fixedEdgeCenter.y + currentLogicDistance.y
    };
    
    const correctedResult = {
      x: fixedEdgeCenter.x + correctedDistance.x,
      y: fixedEdgeCenter.y + correctedDistance.y
    };
    
    console.log('Current implementation result:', currentResult);
    console.log('Corrected logic result:', correctedResult);
    
    // The current implementation gives: { x: 225, y: 150 }
    // The corrected logic gives: { x: 225, y: 150 }
    // They're the same for this case! Let's check why...
    
    // Ah! For right edge resize:
    // - Current: uses localDistances['right'] = { x: newWidth/2, y: 0 }
    // - Corrected: uses -localDistances['left'] = -{ x: -newWidth/2, y: 0 } = { x: newWidth/2, y: 0 }
    // They're mathematically equivalent!
    
    expect(currentResult.x).toBeCloseTo(correctedResult.x, 10);
    expect(currentResult.y).toBeCloseTo(correctedResult.y, 10);
    
    console.log('The current implementation is actually mathematically correct!');
  });
}); 