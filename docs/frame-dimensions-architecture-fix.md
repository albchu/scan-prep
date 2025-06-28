# Frame Dimensions Architecture Fix

## Problem Statement

The current spatial edge-fixed resize implementation has a fundamental architectural flaw that causes inward resize operations to fail on rotated frames. The root cause is the confusion between **frame dimensions** (the actual width/height of the rectangular frame) and **bounding box dimensions** (the axis-aligned rectangle that contains the rotated frame).

## Root Cause Analysis

### The Core Issue

When a frame is rotated, there are two different dimensional representations:

1. **Frame Dimensions**: The actual width and height of the rectangular frame itself (e.g., 100×60 pixels)
2. **Bounding Box Dimensions**: The axis-aligned rectangle that fully contains the rotated frame (e.g., 113×113 pixels for a 45° rotation)

The current implementation only stores the bounding box and attempts to reverse-engineer the frame dimensions, which is:
- Mathematically complex and error-prone
- Impossible to solve uniquely for certain rotation angles (like 45°)
- Unnecessary since we know the frame dimensions when we create/resize the frame

### Visual Demonstration

```
Original Frame (100×60):
┌─────────────────────────────────────┐  100px
│                                     │
│            FRAME                    │  60px
│                                     │
└─────────────────────────────────────┘
Frame dimensions: 100×60
Bounding box: 100×60 (same)

After 45° Rotation:
    ┌─────────────────────────┐
   ╱│                         │╲
  ╱ │                         │ ╲
 ╱  │         FRAME           │  ╲  Frame dimensions: 100×60 (unchanged)
╱   │       (100×60)          │   ╲ Bounding box: 113×113 (larger!)
│   │                         │   │
╲   │                         │   ╱
 ╲  │                         │  ╱
  ╲ │                         │ ╱
   ╲│                         │╱
    └─────────────────────────┘
```

### How This Causes the Resize Bug

When the user tries to resize a rotated frame:

1. **Current (Buggy) Algorithm**:
   - Uses bounding box dimensions (113×113) as baseline
   - User drags inward by 20px
   - Algorithm calculates: 113 - 20 = 93px
   - But 113×113 was never the real frame size!
   - Result: Unpredictable resize behavior

2. **Correct Algorithm**:
   - Uses frame dimensions (100×60) as baseline
   - User drags inward by 20px
   - Algorithm calculates: 100 - 20 = 80px
   - Result: Frame correctly shrinks from 100×60 to 80×60

### Mathematical Evidence

From our test case (100×60 frame rotated 45°):

```
Bounding Box: 113.137×113.137 pixels
Actual Frame: 100×60 pixels

User drags inward by 30px (local delta: -21.21px):

Wrong calculation (using bounding box):
- Estimated original width: ~80px (from reverse calculation)
- New width: 80 + (-21.21) = 58.79px
- Error: Should be 78.79px

Correct calculation (using frame dimensions):
- Known original width: 100px
- New width: 100 + (-21.21) = 78.79px
- Result: Correct!

Difference: 20px error that cascades through the entire algorithm
```

## Proposed Solution

### 1. Update ViewportFrame Interface

Add a `frameDimensions` field to store the actual frame dimensions:

```typescript
export interface ViewportFrame {
  id: string;
  boundingBox: BoundingBox; // Axis-aligned bounding box (for rendering/collision)
  rotation: number; // User-applied rotation in degrees
  
  // NEW: Store the actual frame dimensions (independent of rotation)
  frameDimensions: {
    width: number;
    height: number;
  };
  
  area: number; // pixel area
}
```

### 2. Update Spatial Resize Algorithm

Modify the resize functions to use the stored frame dimensions:

```typescript
export function calculateSpatialEdgeFixedResize(
  originalBoundingBox: BoundingBox,
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  frameDimensions: { width: number, height: number }, // NEW: Required parameter
  imageWidth: number = Infinity,
  imageHeight: number = Infinity,
  minWidth: number = 20,
  minHeight: number = 20
): { newBoundingBox: BoundingBox, newFrameDimensions: { width: number, height: number } } {
  
  // Step 1: Convert mouse delta to image coordinates
  const imageDelta = applyInverseScaleTransform(mouseDelta, scaleFactors);
  
  // Step 2: Transform to frame local coordinates  
  const localDelta = transformMouseDeltaToFrameLocal(imageDelta, frameRotation);
  
  // Step 3: Calculate new frame dimensions using the KNOWN frame dimensions
  const newDimensions = calculateNewFrameDimensions(
    frameDimensions.width,  // Use stored dimensions, not calculated!
    frameDimensions.height,
    resizeEdge,
    localDelta,
    minWidth,
    minHeight
  );
  
  // Step 4: Calculate new frame center maintaining fixed edge constraint
  const currentCenter = calculateRectangleCenter(
    originalBoundingBox.x, originalBoundingBox.y,
    originalBoundingBox.width, originalBoundingBox.height
  );
  
  const rotatedCorners = calculateRotatedCorners(
    currentCenter, 
    frameDimensions.width,  // Use stored dimensions
    frameDimensions.height, 
    frameRotation
  );
  
  const oppositeEdge = getOppositeEdge(resizeEdge);
  const fixedEdgeCenter = getFixedEdgeCenter(rotatedCorners, oppositeEdge);
  
  const newFrameCenter = calculateNewFrameCenter(
    fixedEdgeCenter,
    newDimensions.width,
    newDimensions.height, 
    frameRotation,
    resizeEdge
  );
  
  // Step 5: Calculate new bounding box for the resized frame
  const newBoundingBox = calculateAxisAlignedBoundingBox(
    newFrameCenter,
    newDimensions.width,
    newDimensions.height,
    frameRotation
  );
  
  return { 
    newBoundingBox,
    newFrameDimensions: newDimensions
  };
}
```

### 3. Update Frame Dimensions on Resize

Ensure frame dimensions are updated whenever a resize occurs:

```typescript
// In the resize handler:
const resizeResult = calculateSpatialEdgeFixedResize(
  frame.boundingBox,
  frame.rotation,
  resizeEdge,
  mouseDelta,
  scaleFactors,
  frame.frameDimensions, // Pass current frame dimensions
  imageWidth,
  imageHeight
);

// Update both bounding box AND frame dimensions
const updatedFrame: ViewportFrame = {
  ...frame,
  boundingBox: resizeResult.newBoundingBox,
  frameDimensions: resizeResult.newFrameDimensions, // Update frame dimensions
  area: resizeResult.newFrameDimensions.width * resizeResult.newFrameDimensions.height
};
```

### 4. Initialize Frame Dimensions Correctly

When creating new frames:

```typescript
// During initial detection (0° rotation):
const newFrame: ViewportFrame = {
  id: generateId(),
  boundingBox: detectedBoundingBox,
  rotation: 0,
  frameDimensions: {
    width: detectedBoundingBox.width,  // Same as bounding box initially
    height: detectedBoundingBox.height
  },
  area: detectedBoundingBox.width * detectedBoundingBox.height
};

// During rotation (frame dimensions stay the same, bounding box changes):
const rotatedFrame: ViewportFrame = {
  ...frame,
  rotation: newRotation,
  frameDimensions: frame.frameDimensions, // Keep frame dimensions unchanged
  boundingBox: calculateAxisAlignedBoundingBox(
    frameCenter,
    frame.frameDimensions.width,  // Use frame dimensions
    frame.frameDimensions.height,
    newRotation
  )
};
```

## Benefits of This Approach

### 1. **Mathematical Accuracy**
- No more reverse-engineering dimensions from bounding boxes
- No floating-point precision errors from complex calculations
- No under-constrained mathematical problems

### 2. **Predictable Behavior**
- Resize operations work consistently at all rotation angles
- Inward resize always makes frames smaller
- Outward resize always makes frames larger

### 3. **Performance**
- Direct dimension lookup instead of complex calculations
- Eliminates the need for `calculateOriginalFrameDimensions` function
- Faster resize operations

### 4. **Maintainability**
- Clear separation of concerns: bounding box vs frame dimensions
- Easier to debug and understand
- Less complex code with fewer edge cases

### 5. **Extensibility**
- Easy to add features like aspect ratio locking
- Simple to implement dimension constraints
- Clear data flow for future enhancements

## Migration Strategy

### Phase 1: Add frameDimensions Field
1. Update `ViewportFrame` interface
2. Update frame creation logic to populate `frameDimensions`
3. Ensure backward compatibility during transition

### Phase 2: Update Resize Algorithm
1. Modify resize functions to accept `frameDimensions` parameter
2. Update resize logic to use stored dimensions
3. Return both new bounding box and new frame dimensions

### Phase 3: Update UI Integration
1. Update resize handlers to pass frame dimensions
2. Update frame state management to store both values
3. Update rotation logic to preserve frame dimensions

### Phase 4: Remove Legacy Code
1. Remove `calculateOriginalFrameDimensions` function
2. Clean up complex 45° rotation handling
3. Simplify test cases

## Expected Outcomes

After implementing this fix:

- ✅ **Inward resize works correctly**: Frame shrinks when user drags inward
- ✅ **Outward resize continues to work**: No regression in existing functionality
- ✅ **All rotation angles work consistently**: No special cases for 45° or other angles
- ✅ **Predictable behavior**: Users get exactly what they expect
- ✅ **Better performance**: Faster resize operations
- ✅ **Cleaner architecture**: Clear separation between frame and bounding box concepts

This architectural fix addresses the root cause of the inward resize bug and provides a solid foundation for reliable frame manipulation in the application. 