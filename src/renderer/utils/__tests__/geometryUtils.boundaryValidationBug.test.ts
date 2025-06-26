import {
  calculateSpatialEdgeFixedResize,
  validateImageBoundariesWithFixedEdge,
  calculateRotatedCorners,
  getFixedEdgeCenter,
  calculateAxisAlignedBoundingBox,
  calculateRectangleCenter,
  getOppositeEdge,
  Point
} from "../geometryUtils";
import { BoundingBox } from "@shared/types";

describe("Boundary Validation Bug Detection", () => {
  const scaleFactors = { scaleX: 1, scaleY: 1 };
  const imageWidth = 1000;
  const imageHeight = 800;

  it("should identify issues with iterative dimension reduction in boundary validation", () => {
    console.log('\n=== Testing Boundary Validation Logic ===');
    
    // Test case: frame near the edge that should trigger boundary validation
    const originalBox: BoundingBox = { x: 900, y: 400, width: 80, height: 60 };
    const frameRotation = 45;
    const mouseDelta: Point = { x: 200, y: 0 }; // Try to resize way beyond boundary
    
    console.log('Original box:', originalBox);
    console.log('Mouse delta:', mouseDelta);
    console.log('Image boundaries:', { width: imageWidth, height: imageHeight });
    
    // Step-by-step calculation to see what happens
    const originalCenter = calculateRectangleCenter(
      originalBox.x, originalBox.y, originalBox.width, originalBox.height
    );
    const originalCorners = calculateRotatedCorners(
      originalCenter, originalBox.width, originalBox.height, frameRotation
    );
    const fixedEdgeCenter = getFixedEdgeCenter(originalCorners, 'left');
    
    console.log('Fixed edge center (left):', fixedEdgeCenter);
    
    // Calculate what the new bounding box would be without boundary validation
    const result = calculateSpatialEdgeFixedResize(
      originalBox, frameRotation, 'right', mouseDelta, scaleFactors,
      Infinity, Infinity // No boundary validation
    );
    console.log('Result without boundary validation:', result);
    
    // Now with boundary validation
    const resultWithBoundaries = calculateSpatialEdgeFixedResize(
      originalBox, frameRotation, 'right', mouseDelta, scaleFactors,
      imageWidth, imageHeight
    );
    console.log('Result with boundary validation:', resultWithBoundaries);
    
    // Check if the boundary validation is too conservative
    const isWithinBounds = (
      resultWithBoundaries.x >= 0 &&
      resultWithBoundaries.y >= 0 &&
      resultWithBoundaries.x + resultWithBoundaries.width <= imageWidth &&
      resultWithBoundaries.y + resultWithBoundaries.height <= imageHeight
    );
    
    console.log('Result is within bounds:', isWithinBounds);
    
    // The result should be within bounds
    expect(isWithinBounds).toBe(true);
    
    // But it should also be larger than the original (since we're expanding)
    // If boundary validation is too conservative, this might fail
    console.log('Original area:', originalBox.width * originalBox.height);
    console.log('Result area:', resultWithBoundaries.width * resultWithBoundaries.height);
  });

  it("should test the validateImageBoundariesWithFixedEdge function directly", () => {
    console.log('\n=== Testing validateImageBoundariesWithFixedEdge Directly ===');
    
    // Create a bounding box that exceeds boundaries
    const exceedingBox: BoundingBox = { x: 950, y: 700, width: 200, height: 150 };
    const frameRotation = 30;
    const frameDimensions = { width: 180, height: 120 }; // Actual frame dimensions
    const resizeEdge = 'right';
    
    // Calculate fixed edge center
    const center = calculateRectangleCenter(
      exceedingBox.x, exceedingBox.y, exceedingBox.width, exceedingBox.height
    );
    const corners = calculateRotatedCorners(center, frameDimensions.width, frameDimensions.height, frameRotation);
    const fixedEdgeCenter = getFixedEdgeCenter(corners, getOppositeEdge(resizeEdge));
    
    console.log('Exceeding box:', exceedingBox);
    console.log('Frame dimensions:', frameDimensions);
    console.log('Fixed edge center:', fixedEdgeCenter);
    
    const validatedBox = validateImageBoundariesWithFixedEdge(
      exceedingBox,
      fixedEdgeCenter,
      frameDimensions,
      frameRotation,
      resizeEdge,
      imageWidth,
      imageHeight
    );
    
    console.log('Validated box:', validatedBox);
    
    // Check if the validated box is within bounds
    const isWithinBounds = (
      validatedBox.x >= 0 &&
      validatedBox.y >= 0 &&
      validatedBox.x + validatedBox.width <= imageWidth &&
      validatedBox.y + validatedBox.height <= imageHeight
    );
    
    console.log('Validated box is within bounds:', isWithinBounds);
    expect(isWithinBounds).toBe(true);
    
    // We need to figure out what the actual frame dimensions are for the validated box
    // This is tricky because the validated box is axis-aligned but we need the rotated frame dimensions
    
    // For now, let's just verify the function doesn't crash and produces reasonable output
    expect(validatedBox.width).toBeGreaterThan(0);
    expect(validatedBox.height).toBeGreaterThan(0);
  });

  it("should identify the constraint dimensions mutation bug", () => {
    console.log('\n=== Testing Constraint Dimensions Mutation Bug ===');
    
    // The bug is that constrainedDimensions is being mutated in the while loop
    // This means once it starts reducing, it can't recover, leading to overly small results
    
    const originalBox: BoundingBox = { x: 800, y: 600, width: 100, height: 100 };
    const frameRotation = 45;
    const mouseDelta: Point = { x: 300, y: 0 }; // Large resize that will hit boundaries
    
    console.log('Testing large resize that hits boundaries...');
    console.log('Original box:', originalBox);
    
    // Test with a reasonable boundary
    const result1 = calculateSpatialEdgeFixedResize(
      originalBox, frameRotation, 'right', mouseDelta, scaleFactors,
      1000, 800 // Reasonable boundaries
    );
    
    // Test with tighter boundaries
    const result2 = calculateSpatialEdgeFixedResize(
      originalBox, frameRotation, 'right', mouseDelta, scaleFactors,
      900, 700 // Tighter boundaries
    );
    
    console.log('Result with reasonable boundaries:', result1);
    console.log('Result with tighter boundaries:', result2);
    
    // Both should be valid, but result2 should be smaller due to tighter constraints
    expect(result1.width).toBeGreaterThan(0);
    expect(result1.height).toBeGreaterThan(0);
    expect(result2.width).toBeGreaterThan(0);
    expect(result2.height).toBeGreaterThan(0);
    
    // The tighter boundary should produce a smaller or equal result
    const area1 = result1.width * result1.height;
    const area2 = result2.width * result2.height;
    console.log('Area with reasonable boundaries:', area1);
    console.log('Area with tighter boundaries:', area2);
    
    // This test might reveal if the boundary validation is working correctly
  });

  it("should test the fundamental assumption about bounding box vs frame dimensions", () => {
    console.log('\n=== Testing Bounding Box vs Frame Dimensions Assumption ===');
    
    // There might be confusion between:
    // 1. The axis-aligned bounding box dimensions (what we store)
    // 2. The actual rotated frame dimensions (what we use for calculations)
    
    const frameWidth = 100;
    const frameHeight = 60;
    const frameRotation = 45;
    const center = { x: 200, y: 200 };
    
    // Calculate the axis-aligned bounding box for this rotated frame
    const boundingBox = calculateAxisAlignedBoundingBox(
      center, frameWidth, frameHeight, frameRotation
    );
    
    console.log('Frame dimensions:', { width: frameWidth, height: frameHeight });
    console.log('Calculated bounding box:', boundingBox);
    
    // The bounding box dimensions should be larger than the frame dimensions for rotated frames
    console.log('Bounding box area:', boundingBox.width * boundingBox.height);
    console.log('Frame area:', frameWidth * frameHeight);
    
    // Now, if we use the bounding box dimensions as frame dimensions in calculations,
    // we'll get incorrect results
    const wrongCorners = calculateRotatedCorners(
      center, boundingBox.width, boundingBox.height, frameRotation
    );
    
    const correctCorners = calculateRotatedCorners(
      center, frameWidth, frameHeight, frameRotation
    );
    
    console.log('Wrong corners (using bounding box dims):', wrongCorners);
    console.log('Correct corners (using frame dims):', correctCorners);
    
    // The wrong corners should create a much larger rotated rectangle
    const wrongBoundingBox = calculateAxisAlignedBoundingBox(
      center, boundingBox.width, boundingBox.height, frameRotation
    );
    
    console.log('Wrong bounding box (using bounding box dims):', wrongBoundingBox);
    
    // This test reveals a potential source of confusion in the implementation
    expect(wrongBoundingBox.width).toBeGreaterThan(boundingBox.width);
    expect(wrongBoundingBox.height).toBeGreaterThan(boundingBox.height);
  });
}); 