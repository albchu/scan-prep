# Spatial Edge-Fixed Resize Implementation Plan

## Problem Statement

The current ViewportFrame resize implementation fails to provide intuitive resize behavior for rotated frames. When a user resizes a rotated frame, the opposite edge should remain fixed in its spatial position, requiring recalculation of the axis-aligned bounding box coordinates to maintain this spatial constraint.

## Mathematical Foundation

### Coordinate Systems

1. **Image Coordinates**: The underlying image coordinate system (axis-aligned, origin at top-left)
2. **Display Coordinates**: The scaled display coordinate system  
3. **Frame Local Coordinates**: The rotated frame's coordinate system where edges align with cardinal directions

### Rotation Matrix Convention

**Important**: We use the standard mathematical rotation matrix:
```
R = [cos(θ)  -sin(θ)]
    [sin(θ)   cos(θ)]
```

In UI frameworks with **+y downward**, this matrix produces **clockwise visual rotation** for positive θ values. This means `rotation: 45` creates a 45° clockwise visual rotation on screen.

### Core Mathematical Concept: Spatial Edge Fixing

When resizing a rotated frame, one spatial edge must remain fixed while the opposite edge moves. This requires:

1. **Identify the spatial edges** of the rotated frame
2. **Determine which edge remains fixed** during resize
3. **Calculate new frame dimensions** in the rotated coordinate system
4. **Recalculate the axis-aligned bounding box** that represents the resized rotated frame

## Detailed Mathematical Analysis

### Step 1: Rotated Frame Edge Calculation

For a frame with bounding box `{x, y, width, height}` and rotation `θ` (in degrees):

#### Frame Corner Points (in image coordinates)
```
// Axis-aligned corners
topLeft = {x, y}
topRight = {x + width, y}  
bottomRight = {x + width, y + height}
bottomLeft = {x, y + height}

// Frame center
center = {x + width/2, y + height/2}
```

#### Rotated Corner Points
Apply rotation matrix around center:
```
// Rotation matrix for angle θ (produces clockwise rotation in +y downward systems)
R = [cos(θ)  -sin(θ)]
    [sin(θ)   cos(θ)]

// For each corner point P, rotated point P' = R * (P - center) + center
rotatedTopLeft = rotatePointAroundCenter(topLeft, center, θ)
rotatedTopRight = rotatePointAroundCenter(topRight, center, θ)  
rotatedBottomRight = rotatePointAroundCenter(bottomRight, center, θ)
rotatedBottomLeft = rotatePointAroundCenter(bottomLeft, center, θ)
```

#### Helper Function: Calculate Rotated Corners
```typescript
function calculateRotatedCorners(
  frameCenter: Point,
  frameWidth: number,
  frameHeight: number,
  frameRotation: number
): Point[] {
  const halfWidth = frameWidth / 2;
  const halfHeight = frameHeight / 2;
  const angleRad = (frameRotation * Math.PI) / 180;
  
  const localCorners = [
    {x: -halfWidth, y: -halfHeight}, // topLeft
    {x: halfWidth, y: -halfHeight},  // topRight
    {x: halfWidth, y: halfHeight},   // bottomRight  
    {x: -halfWidth, y: halfHeight}   // bottomLeft
  ];
  
  return localCorners.map(corner => ({
    x: frameCenter.x + corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad),
    y: frameCenter.y + corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad)
  }));
}
```

#### Spatial Edge Definitions
```
// Frame edges (renamed for clarity)
topEdge = {start: rotatedTopLeft, end: rotatedTopRight}
rightEdge = {start: rotatedTopRight, end: rotatedBottomRight}  
bottomEdge = {start: rotatedBottomRight, end: rotatedBottomLeft}
leftEdge = {start: rotatedBottomLeft, end: rotatedTopLeft}
```

### Step 2: Edge Handle to Spatial Edge Mapping (CORRECTED)

For intuitive behavior, we need to map resize handles to the edge whose normal is closest to the drag direction. The original 90° quadrant approach was insufficient.

```typescript
function getResizeEdgeMapping(rotation: number, dragDirection: Point): 'top' | 'right' | 'bottom' | 'left' {
  // Normalize rotation to 0-360 range
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  
  // Calculate edge normals (outward pointing)
  const angleRad = (normalizedRotation * Math.PI) / 180;
  const edgeNormals = {
    top: { x: -Math.sin(angleRad), y: -Math.cos(angleRad) },
    right: { x: Math.cos(angleRad), y: -Math.sin(angleRad) },
    bottom: { x: Math.sin(angleRad), y: Math.cos(angleRad) },
    left: { x: -Math.cos(angleRad), y: Math.sin(angleRad) }
  };
  
  // Find edge normal most aligned with drag direction
  let bestEdge: 'top' | 'right' | 'bottom' | 'left' = 'top';
  let bestDot = -Infinity;
  
  for (const [edge, normal] of Object.entries(edgeNormals)) {
    const dot = dragDirection.x * normal.x + dragDirection.y * normal.y;
    if (dot > bestDot) {
      bestDot = dot;
      bestEdge = edge as 'top' | 'right' | 'bottom' | 'left';
    }
  }
  
  return bestEdge;
}
```

### Step 3: Fixed Edge Constraint Mathematics

When resizing edge E, the opposite edge must remain spatially fixed.

#### Edge Pair Definitions
```
oppositePairs = {
  'top': 'bottom',
  'right': 'left', 
  'bottom': 'top',
  'left': 'right'
}
```

#### Fixed Edge Center Point
```typescript
function getFixedEdgeCenter(
  rotatedCorners: Point[],
  fixedEdge: 'top' | 'right' | 'bottom' | 'left'
): Point {
  
  const edgeCornerMap = {
    'top': [rotatedCorners[0], rotatedCorners[1]], // topLeft, topRight
    'right': [rotatedCorners[1], rotatedCorners[2]], // topRight, bottomRight  
    'bottom': [rotatedCorners[2], rotatedCorners[3]], // bottomRight, bottomLeft
    'left': [rotatedCorners[3], rotatedCorners[0]] // bottomLeft, topLeft
  };
  
  const [p1, p2] = edgeCornerMap[fixedEdge];
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2  
  };
}
```

### Step 4: Resize Calculation in Rotated Space

#### Transform Mouse Delta to Frame Local Coordinates
```typescript
function transformMouseDeltaToFrameLocal(
  mouseDelta: Point, 
  frameRotation: number
): Point {
  const angleRad = (-frameRotation * Math.PI) / 180; // Inverse rotation
  return {
    x: mouseDelta.x * Math.cos(angleRad) - mouseDelta.y * Math.sin(angleRad),
    y: mouseDelta.x * Math.sin(angleRad) + mouseDelta.y * Math.cos(angleRad)
  };
}
```

#### Calculate New Frame Dimensions (with size validation)
```typescript
function calculateNewFrameDimensions(
  originalWidth: number,
  originalHeight: number, 
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  localMouseDelta: Point,
  minWidth: number = 20,
  minHeight: number = 20
): {width: number, height: number} {
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  switch(resizeEdge) {
    case 'top':
      newHeight = originalHeight - localMouseDelta.y;
      break;
    case 'right':  
      newWidth = originalWidth + localMouseDelta.x;
      break;
    case 'bottom':
      newHeight = originalHeight + localMouseDelta.y;
      break;
    case 'left':
      newWidth = originalWidth - localMouseDelta.x;
      break;
  }
  
  // Prevent negative sizes that would flip the object
  newWidth = Math.max(minWidth, newWidth);
  newHeight = Math.max(minHeight, newHeight);
  
  return { width: newWidth, height: newHeight };
}
```

### Step 5: Axis-Aligned Bounding Box Recalculation

#### New Frame Center Calculation (CORRECTED)
```typescript
function calculateNewFrameCenter(
  fixedEdgeCenter: Point,
  newWidth: number,
  newHeight: number,
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left'
): Point {
  
  // Distance from center to each edge in local coordinates
  const localDistances = {
    'top': {x: 0, y: -newHeight/2},
    'right': {x: newWidth/2, y: 0},
    'bottom': {x: 0, y: newHeight/2}, 
    'left': {x: -newWidth/2, y: 0}
  };
  
  // CORRECTED: Use resizeEdge directly (vector from resized edge to center)
  const localDistance = localDistances[resizeEdge];
  
  // Transform distance from local to global coordinates
  const angleRad = (frameRotation * Math.PI) / 180;
  const globalDistance = {
    x: localDistance.x * Math.cos(angleRad) - localDistance.y * Math.sin(angleRad),
    y: localDistance.x * Math.sin(angleRad) + localDistance.y * Math.cos(angleRad)
  };
  
  // New center = fixed edge center + distance from resized edge to center
  return {
    x: fixedEdgeCenter.x + globalDistance.x,
    y: fixedEdgeCenter.y + globalDistance.y
  };
}
```

#### Axis-Aligned Bounding Box from Rotated Frame
```typescript
function calculateAxisAlignedBoundingBox(
  frameCenter: Point,
  frameWidth: number, 
  frameHeight: number,
  frameRotation: number
): BoundingBox {
  
  // IMPORTANT: frameWidth and frameHeight must be the unrotated (local) dimensions
  const corners = calculateRotatedCorners(frameCenter, frameWidth, frameHeight, frameRotation);
  
  // Find axis-aligned bounding box that contains all corners
  const minX = Math.min(...corners.map(c => c.x));
  const maxX = Math.max(...corners.map(c => c.x));
  const minY = Math.min(...corners.map(c => c.y));
  const maxY = Math.max(...corners.map(c => c.y));
  
  return {
    x: minX,
    y: minY, 
    width: maxX - minX,
    height: maxY - minY
  };
}
```

## Complete Algorithm (CORRECTED)

### Main Resize Function
```typescript
function calculateSpatialEdgeFixedResize(
  originalBoundingBox: BoundingBox,
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  imageWidth: number,
  imageHeight: number,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  
  // Step 1: Convert mouse delta to image coordinates
  const imageDelta = {
    x: mouseDelta.x / scaleFactors.scaleX,
    y: mouseDelta.y / scaleFactors.scaleY
  };
  
  // Step 2: Transform to frame local coordinates  
  const localDelta = transformMouseDeltaToFrameLocal(imageDelta, frameRotation);
  
  // Step 3: Calculate new frame dimensions (with size validation)
  const newDimensions = calculateNewFrameDimensions(
    originalBoundingBox.width,
    originalBoundingBox.height,
    resizeEdge,
    localDelta,
    minWidth,
    minHeight
  );
  
  // Step 4: Get current rotated corners
  const currentCenter = {
    x: originalBoundingBox.x + originalBoundingBox.width / 2,
    y: originalBoundingBox.y + originalBoundingBox.height / 2
  };
  const rotatedCorners = calculateRotatedCorners(
    currentCenter, 
    originalBoundingBox.width,
    originalBoundingBox.height, 
    frameRotation
  );
  
  // Step 5: Identify fixed edge and its center
  const oppositeEdge = getOppositeEdge(resizeEdge);
  const fixedEdgeCenter = getFixedEdgeCenter(rotatedCorners, oppositeEdge);
  
  // Step 6: Calculate new frame center
  const newFrameCenter = calculateNewFrameCenter(
    fixedEdgeCenter,
    newDimensions.width,
    newDimensions.height, 
    frameRotation,
    resizeEdge
  );
  
  // Step 7: Calculate new axis-aligned bounding box
  let newBoundingBox = calculateAxisAlignedBoundingBox(
    newFrameCenter,
    newDimensions.width,
    newDimensions.height,
    frameRotation
  );
  
  // Step 8: Validate image boundaries (with fixed-edge preservation)
  newBoundingBox = validateImageBoundariesWithFixedEdge(
    newBoundingBox,
    fixedEdgeCenter,
    newDimensions,
    frameRotation,
    resizeEdge,
    imageWidth,
    imageHeight
  );
  
  return newBoundingBox;
}
```

### Helper Functions

```typescript
function getOppositeEdge(edge: 'top' | 'right' | 'bottom' | 'left'): 'top' | 'right' | 'bottom' | 'left' {
  const opposites = {
    'top': 'bottom' as const,
    'right': 'left' as const,
    'bottom': 'top' as const,
    'left': 'right' as const
  };
  return opposites[edge];
}

function validateImageBoundariesWithFixedEdge(
  boundingBox: BoundingBox,
  fixedEdgeCenter: Point,
  frameDimensions: {width: number, height: number},
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  // If the bounding box exceeds image boundaries, we need to:
  // 1. Clamp the bounding box to image boundaries
  // 2. Recalculate frame center and dimensions while preserving fixed edge
  
  const clampedBox = {
    x: Math.max(0, Math.min(boundingBox.x, imageWidth - boundingBox.width)),
    y: Math.max(0, Math.min(boundingBox.y, imageHeight - boundingBox.height)),
    width: Math.min(boundingBox.width, imageWidth - Math.max(0, boundingBox.x)),
    height: Math.min(boundingBox.height, imageHeight - Math.max(0, boundingBox.y))
  };
  
  // If clamping occurred, recalculate with fixed edge constraint
  if (clampedBox.x !== boundingBox.x || clampedBox.y !== boundingBox.y || 
      clampedBox.width !== boundingBox.width || clampedBox.height !== boundingBox.height) {
    
    // Recalculate frame center that maintains fixed edge position
    const newFrameCenter = calculateNewFrameCenter(
      fixedEdgeCenter,
      frameDimensions.width,
      frameDimensions.height,
      frameRotation,
      resizeEdge
    );
    
    return calculateAxisAlignedBoundingBox(
      newFrameCenter,
      frameDimensions.width,
      frameDimensions.height,
      frameRotation
    );
  }
  
  return clampedBox;
}
```

## Implementation Verification

### Test Cases for Mathematical Soundness

1. **45° Rotation Test**:
   - Frame: `{x: 100, y: 100, width: 200, height: 100, rotation: 45}`
   - Resize right edge by +50px
   - Verify: Left edge spatial position unchanged
   - Verify: New bounding box correctly encompasses resized rotated frame

2. **90° Rotation Test**:
   - Frame: `{x: 50, y: 50, width: 100, height: 200, rotation: 90}`  
   - Resize top edge by -30px
   - Verify: Bottom edge spatial position unchanged
   - Verify: Frame dimensions updated correctly

3. **Arbitrary Angle Test**:
   - Frame: `{x: 0, y: 0, width: 150, height: 150, rotation: 37.5}`
   - Test all four edge resize operations
   - Verify: Opposite edges remain spatially fixed
   - Verify: Mathematical consistency across operations

4. **Negative Size Prevention Test**:
   - Drag past the fixed edge
   - Verify: Dimensions clamped to minimum values
   - Verify: Fixed edge constraint maintained

### Mathematical Verification Properties

1. **Fixed Edge Invariant**: The spatial position of the opposite edge must remain unchanged
2. **Dimension Consistency**: Frame dimensions in local space must match resize delta (after clamping)
3. **Bounding Box Validity**: Axis-aligned bounding box must fully contain rotated frame
4. **Rotation Preservation**: Frame rotation value must remain unchanged during resize
5. **Size Constraints**: Minimum size limits prevent object inversion

This corrected mathematical approach ensures that resize operations on rotated frames behave intuitively while maintaining the axis-aligned bounding box representation required by the rendering system. 