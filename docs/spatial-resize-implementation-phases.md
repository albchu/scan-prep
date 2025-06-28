# Spatial Edge-Fixed Resize Implementation Phases

## Overview

This document outlines the phased implementation approach for the spatial edge-fixed resize system based on the mathematical foundation established in `spatial-edge-fixed-resize-plan.md`. The implementation is broken into manageable phases with clear dependencies and testing strategies.

## Implementation Strategy

### Core Principles
1. **Incremental Development**: Each phase builds on the previous and can be tested independently
2. **Backward Compatibility**: Non-rotated frames continue to work throughout implementation
3. **Mathematical Validation**: Each phase includes verification tests for mathematical correctness
4. **Minimal Disruption**: Existing resize functionality remains operational during development

### Phase Dependencies
```
Phase 1: Core Geometry Utilities
    ↓
Phase 2: Frame Analysis Functions  
    ↓
Phase 3: Spatial Resize Algorithm
    ↓
Phase 4: Hook Integration
    ↓
Phase 5: Edge Mapping & UI Integration
    ↓
Phase 6: Boundary Validation & Polish
```

## Phase 1: Core Geometry Utilities

### Objective
Implement the fundamental geometric transformation functions required for spatial edge-fixed resize.

### Files to Modify
- `src/renderer/utils/geometryUtils.ts`

### Implementation Tasks

#### 1.1 Add Point Rotation Function
```typescript
/**
 * Transform a point by rotating it around origin by given angle
 * @param point - The point to rotate (x, y coordinates)
 * @param angleInDegrees - Rotation angle in degrees (positive = clockwise in +y downward systems)
 * @returns The rotated point
 */
export function rotatePoint(point: Point, angleInDegrees: number): Point {
  const angleRad = (angleInDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}
```

#### 1.2 Add Mouse Delta Transformation
```typescript
/**
 * Apply inverse rotation to transform mouse delta to frame's local coordinate system
 * @param mouseDelta - Mouse movement delta in global coordinates
 * @param frameRotation - Frame's rotation in degrees
 * @returns Mouse delta transformed to frame's local coordinate system
 */
export function transformMouseDeltaToFrameLocal(
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

#### 1.3 Add Rotated Corners Calculation
```typescript
/**
 * Calculate the four corner points of a rotated frame
 * @param frameCenter - Center point of the frame
 * @param frameWidth - Unrotated width of the frame
 * @param frameHeight - Unrotated height of the frame
 * @param frameRotation - Rotation angle in degrees
 * @returns Array of corner points [topLeft, topRight, bottomRight, bottomLeft]
 */
export function calculateRotatedCorners(
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

### Testing Strategy for Phase 1
- **Unit Tests**: Test each function with known input/output pairs
- **Rotation Tests**: Verify 0°, 90°, 180°, 270°, 45° rotations
- **Inverse Tests**: Verify `transformMouseDeltaToFrameLocal` correctly inverts rotations
- **Corner Tests**: Verify corner calculations match expected positions

### Success Criteria
- All geometry utility functions pass unit tests
- Mathematical accuracy verified for common rotation angles
- Functions integrate cleanly with existing geometry utilities

## Phase 2: Frame Analysis Functions

### Objective
Implement functions to analyze rotated frames and determine spatial edge properties.

### Files to Modify
- `src/renderer/utils/geometryUtils.ts`

### Implementation Tasks

#### 2.1 Add Fixed Edge Center Calculation
```typescript
/**
 * Get the center point of a specific edge of a rotated frame
 * @param rotatedCorners - The four corner points of the rotated frame
 * @param edge - Which edge to get the center of
 * @returns Center point of the specified edge
 */
export function getFixedEdgeCenter(
  rotatedCorners: Point[],
  edge: 'top' | 'right' | 'bottom' | 'left'
): Point {
  const edgeCornerMap = {
    'top': [rotatedCorners[0], rotatedCorners[1]], // topLeft, topRight
    'right': [rotatedCorners[1], rotatedCorners[2]], // topRight, bottomRight  
    'bottom': [rotatedCorners[2], rotatedCorners[3]], // bottomRight, bottomLeft
    'left': [rotatedCorners[3], rotatedCorners[0]] // bottomLeft, topLeft
  };
  
  const [p1, p2] = edgeCornerMap[edge];
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2  
  };
}
```

#### 2.2 Add Edge Mapping Function
```typescript
/**
 * Determine which logical edge should be resized based on drag direction
 * @param rotation - Frame rotation in degrees
 * @param dragDirection - Normalized drag direction vector
 * @returns The logical edge that best matches the drag direction
 */
export function getResizeEdgeMapping(
  rotation: number, 
  dragDirection: Point
): 'top' | 'right' | 'bottom' | 'left' {
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

#### 2.3 Add Helper Functions
```typescript
/**
 * Get the opposite edge for a given edge
 */
export function getOppositeEdge(edge: 'top' | 'right' | 'bottom' | 'left'): 'top' | 'right' | 'bottom' | 'left' {
  const opposites = {
    'top': 'bottom' as const,
    'right': 'left' as const,
    'bottom': 'top' as const,
    'left': 'right' as const
  };
  return opposites[edge];
}
```

### Testing Strategy for Phase 2
- **Edge Center Tests**: Verify edge centers are calculated correctly for various rotations
- **Edge Mapping Tests**: Test edge mapping with different rotation angles and drag directions
- **Integration Tests**: Verify functions work together correctly

### Success Criteria
- Edge analysis functions produce correct results for test cases
- Edge mapping correctly identifies intended resize edges
- Functions handle edge cases (0°, 90°, arbitrary angles)

## Phase 3: Spatial Resize Algorithm

### Objective
Implement the core spatial edge-fixed resize algorithm.

### Files to Modify
- `src/renderer/utils/geometryUtils.ts`

### Implementation Tasks

#### 3.1 Add Frame Dimension Calculation
```typescript
/**
 * Calculate new frame dimensions based on resize operation
 * @param originalWidth - Current frame width
 * @param originalHeight - Current frame height
 * @param resizeEdge - Which edge is being resized
 * @param localMouseDelta - Mouse delta in frame local coordinates
 * @param minWidth - Minimum allowed width
 * @param minHeight - Minimum allowed height
 * @returns New frame dimensions
 */
export function calculateNewFrameDimensions(
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

#### 3.2 Add Frame Center Calculation
```typescript
/**
 * Calculate new frame center that maintains fixed edge constraint
 * @param fixedEdgeCenter - Center point of the edge that should remain fixed
 * @param newWidth - New frame width
 * @param newHeight - New frame height
 * @param frameRotation - Frame rotation in degrees
 * @param resizeEdge - Which edge was resized
 * @returns New frame center point
 */
export function calculateNewFrameCenter(
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
  
  // Use resizeEdge directly (vector from resized edge to center)
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

#### 3.3 Add Main Resize Algorithm
```typescript
/**
 * Calculate new bounding box for spatial edge-fixed resize
 * @param originalBoundingBox - Current axis-aligned bounding box
 * @param frameRotation - Frame rotation in degrees
 * @param resizeEdge - Which edge is being resized
 * @param mouseDelta - Mouse movement delta in display coordinates
 * @param scaleFactors - Scale factors for coordinate conversion
 * @param minWidth - Minimum allowed width
 * @param minHeight - Minimum allowed height
 * @returns New axis-aligned bounding box
 */
export function calculateSpatialEdgeFixedResize(
  originalBoundingBox: BoundingBox,
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
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
  
  // Step 3: Calculate new frame dimensions
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
  const corners = calculateRotatedCorners(
    newFrameCenter,
    newDimensions.width,
    newDimensions.height,
    frameRotation
  );
  
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

### Testing Strategy for Phase 3
- **Algorithm Tests**: Test complete resize algorithm with known inputs
- **Fixed Edge Tests**: Verify opposite edges remain spatially fixed
- **Dimension Tests**: Verify frame dimensions update correctly
- **Boundary Tests**: Test minimum size constraints

### Success Criteria
- Resize algorithm produces mathematically correct results
- Fixed edge constraint is maintained for all test cases
- Algorithm handles minimum size constraints properly

## Phase 4: Hook Integration

### Objective
Integrate the spatial resize algorithm into the existing `useResizeDrag` hook.

### Files to Modify
- `src/renderer/hooks/useResizeDrag.ts`

### Implementation Tasks

#### 4.1 Update calculateResizedBoundingBox Function
Replace the existing function with a wrapper that detects rotation and chooses the appropriate algorithm:

```typescript
export function calculateResizedBoundingBox(
  originalBox: BoundingBox,
  edge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  frameRotation: number = 0,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  // For non-rotated frames, use the existing simple algorithm
  if (frameRotation === 0) {
    return calculateAxisAlignedResize(
      originalBox,
      edge,
      mouseDelta,
      scaleFactors,
      minWidth,
      minHeight
    );
  }
  
  // For rotated frames, use the spatial edge-fixed algorithm
  return calculateSpatialEdgeFixedResize(
    originalBox,
    frameRotation,
    edge,
    mouseDelta,
    scaleFactors,
    minWidth,
    minHeight
  );
}
```

#### 4.2 Preserve Existing Algorithm
Move the current resize logic to a separate function to maintain backward compatibility:

```typescript
function calculateAxisAlignedResize(
  originalBox: BoundingBox,
  edge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  minWidth: number,
  minHeight: number
): BoundingBox {
  // Existing resize logic for non-rotated frames
  // ... (current implementation)
}
```

#### 4.3 Update Hook to Pass Rotation
Ensure the `useResizeDrag` hook passes the frame rotation to the resize calculation:

```typescript
// In handleGlobalMouseMove function:
const newBoundingBox = calculateResizedBoundingBox(
  currentDragState.startBoundingBox,
  currentDragState.edge,
  mouseDelta,
  scaleFactors,
  viewportFrame.rotation, // Pass the frame's rotation
  minWidth,
  minHeight
);
```

### Testing Strategy for Phase 4
- **Backward Compatibility**: Verify non-rotated frames still work correctly
- **Rotation Integration**: Test that rotated frames use the new algorithm
- **Hook Functionality**: Verify the hook continues to work with existing UI

### Success Criteria
- Non-rotated frames continue to resize exactly as before
- Rotated frames use the new spatial edge-fixed algorithm
- No breaking changes to existing hook interface

## Phase 5: Edge Mapping & UI Integration

### Objective
Implement intelligent edge mapping and integrate with the UI components.

### Files to Modify
- `src/renderer/components/ImagePreview/FramesOverlay.tsx`
- `src/renderer/hooks/useResizeDrag.ts`

### Implementation Tasks

#### 5.1 Add Edge Detection to Resize Start
Update the resize start logic to determine the appropriate edge based on drag direction:

```typescript
// In useResizeDrag hook
const handleResizeStart = useCallback((
  event: React.MouseEvent,
  viewportFrame: ViewportFrame,
  edge: 'top' | 'right' | 'bottom' | 'left',
  containerElement: HTMLElement | null
) => {
  event.preventDefault();
  
  if (!containerElement) return;
  
  // Get mouse position relative to container
  const mousePos = getMousePositionRelativeToElement(event, containerElement);
  
  // For rotated frames, determine the actual edge based on drag direction
  let actualEdge = edge;
  if (viewportFrame.rotation !== 0) {
    // Calculate drag direction (will be updated during mouse move)
    // For now, use the handle edge as provided
    actualEdge = edge;
  }
  
  // Store the initial state for dragging
  setDragState({
    frameId: viewportFrame.id,
    edge: actualEdge,
    startBoundingBox: { ...viewportFrame.boundingBox },
    startMousePosition: mousePos,
    containerElement,
  });
}, []);
```

#### 5.2 Update Edge Mapping During Drag
Implement dynamic edge mapping based on actual drag direction:

```typescript
// In handleGlobalMouseMove function:
function handleGlobalMouseMove(event: MouseEvent) {
  const currentDragState = dragStateRef.current;
  if (!currentDragState) return;
  
  const viewportFrame = viewportFrames.find(f => f.id === currentDragState.frameId);
  if (!viewportFrame) return;
  
  const mousePos = getMousePositionRelativeToElement(
    event, 
    currentDragState.containerElement
  );
  
  // Calculate mouse delta from start position
  const mouseDelta: Point = {
    x: mousePos.x - currentDragState.startMousePosition.x,
    y: mousePos.y - currentDragState.startMousePosition.y,
  };
  
  // For rotated frames, determine the appropriate edge based on drag direction
  let resizeEdge = currentDragState.edge;
  if (viewportFrame.rotation !== 0 && (Math.abs(mouseDelta.x) > 5 || Math.abs(mouseDelta.y) > 5)) {
    // Normalize drag direction
    const dragLength = Math.sqrt(mouseDelta.x * mouseDelta.x + mouseDelta.y * mouseDelta.y);
    if (dragLength > 0) {
      const dragDirection = {
        x: mouseDelta.x / dragLength,
        y: mouseDelta.y / dragLength
      };
      resizeEdge = getResizeEdgeMapping(viewportFrame.rotation, dragDirection);
    }
  }
  
  // Calculate new bounding box
  const newBoundingBox = calculateResizedBoundingBox(
    currentDragState.startBoundingBox,
    resizeEdge,
    mouseDelta,
    scaleFactors,
    viewportFrame.rotation,
    minWidth,
    minHeight
  );
  
  // ... rest of function
}
```

### Testing Strategy for Phase 5
- **Edge Mapping Tests**: Verify correct edge selection for various drag directions
- **UI Integration Tests**: Test that resize handles work intuitively with rotated frames
- **User Experience Tests**: Manual testing of resize behavior

### Success Criteria
- Resize handles respond intuitively to drag direction on rotated frames
- Edge mapping correctly identifies intended resize operations
- UI remains responsive and smooth during resize operations

## Phase 6: Boundary Validation & Polish

### Objective
Add image boundary validation and polish the implementation.

### Files to Modify
- `src/renderer/utils/geometryUtils.ts`
- `src/renderer/hooks/useResizeDrag.ts`

### Implementation Tasks

#### 6.1 Add Boundary Validation
```typescript
/**
 * Validate bounding box against image boundaries while preserving fixed edge constraint
 */
export function validateImageBoundariesWithFixedEdge(
  boundingBox: BoundingBox,
  fixedEdgeCenter: Point,
  frameDimensions: {width: number, height: number},
  frameRotation: number,
  resizeEdge: 'top' | 'right' | 'bottom' | 'left',
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  // Implementation as specified in the mathematical plan
  // ...
}
```

#### 6.2 Integrate Boundary Validation
Update the main algorithm to include boundary validation:

```typescript
// In calculateSpatialEdgeFixedResize function:
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
```

#### 6.3 Add Performance Optimizations
- Cache trigonometric calculations where possible
- Skip complex calculations for non-rotated frames
- Add early returns for minimal mouse movements

#### 6.4 Add Error Handling
- Validate input parameters
- Handle edge cases gracefully
- Add fallback to simple resize if complex algorithm fails

### Testing Strategy for Phase 6
- **Boundary Tests**: Test resize operations near image edges
- **Performance Tests**: Verify smooth performance during resize operations
- **Error Handling Tests**: Test with invalid inputs and edge cases
- **Integration Tests**: Full end-to-end testing of resize functionality

### Success Criteria
- Resize operations respect image boundaries
- Performance is smooth and responsive
- Error cases are handled gracefully
- Complete functionality works end-to-end

## Final Integration & Testing

### Comprehensive Test Suite
1. **Unit Tests**: All individual functions tested
2. **Integration Tests**: Complete resize workflow tested
3. **Visual Tests**: Manual verification of resize behavior
4. **Performance Tests**: Ensure no performance regression
5. **Regression Tests**: Verify existing functionality unchanged

### Validation Criteria
1. **Mathematical Correctness**: Fixed edge constraint maintained
2. **User Experience**: Intuitive resize behavior for rotated frames
3. **Backward Compatibility**: Non-rotated frames work exactly as before
4. **Performance**: No noticeable performance impact
5. **Robustness**: Handles edge cases and invalid inputs gracefully

## Rollback Strategy

Each phase is designed to be reversible:
- **Phase 1-3**: Pure utility functions, no breaking changes
- **Phase 4**: Wrapper function preserves existing behavior
- **Phase 5-6**: Feature flags can disable new behavior if needed

If issues arise, the implementation can be rolled back by:
1. Disabling rotation-aware resize (force `frameRotation = 0`)
2. Reverting to simple resize algorithm
3. Removing new utility functions if needed

This phased approach ensures a stable, testable implementation of the spatial edge-fixed resize system while maintaining full backward compatibility. 