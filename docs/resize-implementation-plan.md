# Edge-Based Resize Implementation Plan

## Overview
This document outlines the implementation plan for adding edge-based resize functionality to ViewportFrame components. The approach uses edge handles (top, right, bottom, left) instead of corner handles to simplify the implementation, especially for rotated frames.

## Working Order of Operations

### Phase 1: Refactor Corner Handles to Edge Handles
**Priority**: High - Foundation for all resize functionality

#### 1.1 Update ViewportFrameOverlay Component
**File**: `src/renderer/components/ImagePreview/ViewportFrameOverlay.tsx`

**Remove existing corner handles:**
- Delete all 4 corner resize handle divs (`.resizeHandleTopLeft`, `.resizeHandleTopRight`, `.resizeHandleBottomLeft`, `.resizeHandleBottomRight`)

**Add 4 edge resize handles:**
```tsx
{/* Top edge handle */}
<div
  className={`${styles.resizeHandle} ${styles.resizeHandleTop}`}
  onMouseDown={(event) => {
    event.stopPropagation();
    handleResize(event, viewportFrame, 'top');
  }}
/>

{/* Right edge handle */}
<div
  className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
  onMouseDown={(event) => {
    event.stopPropagation();
    handleResize(event, viewportFrame, 'right');
  }}
/>

{/* Bottom edge handle */}
<div
  className={`${styles.resizeHandle} ${styles.resizeHandleBottom}`}
  onMouseDown={(event) => {
    event.stopPropagation();
    handleResize(event, viewportFrame, 'bottom');
  }}
/>

{/* Left edge handle */}
<div
  className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
  onMouseDown={(event) => {
    event.stopPropagation();
    handleResize(event, viewportFrame, 'left');
  }}
/>
```

**Update handleResize prop type:**
```tsx
handleResize: (event: React.MouseEvent, viewportFrame: ViewportFrame, edge: 'top' | 'right' | 'bottom' | 'left') => void;
```

#### 1.2 Update CSS Styles
**File**: `src/renderer/components/ImagePreview/ViewportFrameOverlay.module.css`

**Remove all corner handle styles:**
- Delete `.resizeHandleTopLeft`, `.resizeHandleTopRight`, `.resizeHandleBottomLeft`, `.resizeHandleBottomRight` and their hover states

**Add edge handle styles:**
```css
.resizeHandle {
  position: absolute;
  background-color: #3b82f6;
  border: 2px solid white;
  pointer-events: auto;
  z-index: 10;
}

.resizeHandle:hover {
  background-color: #2563eb;
  transform: scale(1.1);
}

.resizeHandleTop {
  top: -4px;
  left: 50%;
  width: 40px;
  height: 8px;
  transform: translateX(-50%);
  cursor: n-resize;
  border-radius: 4px;
}

.resizeHandleRight {
  right: -4px;
  top: 50%;
  width: 8px;
  height: 40px;
  transform: translateY(-50%);
  cursor: e-resize;
  border-radius: 4px;
}

.resizeHandleBottom {
  bottom: -4px;
  left: 50%;
  width: 40px;
  height: 8px;
  transform: translateX(-50%);
  cursor: s-resize;
  border-radius: 4px;
}

.resizeHandleLeft {
  left: -4px;
  top: 50%;
  width: 8px;
  height: 40px;
  transform: translateY(-50%);
  cursor: w-resize;
  border-radius: 4px;
}

.resizeHandleTop:hover {
  transform: translateX(-50%) scale(1.1);
}

.resizeHandleRight:hover {
  transform: translateY(-50%) scale(1.1);
}

.resizeHandleBottom:hover {
  transform: translateX(-50%) scale(1.1);
}

.resizeHandleLeft:hover {
  transform: translateY(-50%) scale(1.1);
}
```

#### 1.3 Update FramesOverlay Component Signature
**File**: `src/renderer/components/ImagePreview/FramesOverlay.tsx`

**No changes needed to component interface** - FramesOverlay will handle resize directly via store context, just like it handles `addViewportPreview` and `removeViewportPreview`.

**Update handleResize to use store context directly:**
```tsx
const { updateViewportFrameBoundingBox, updateViewportPreview, imagePath } = useImageStore();

const handleResize = useCallback((
  event: React.MouseEvent,
  viewportFrame: ViewportFrame,
  edge: 'top' | 'right' | 'bottom' | 'left'
) => {
  handleResizeStart(event, viewportFrame, edge, overlayRef.current);
}, [handleResizeStart]);
```

**Add useResizeDrag hook usage:**
```tsx
const { handleResizeStart } = useResizeDrag({
  viewportFrames,
  scaleFactors,
  onResizeChange: (frameId: string, newBoundingBox: BoundingBox) => {
    updateViewportFrameBoundingBox(frameId, newBoundingBox);
    updateViewportPreview(frameId, imagePath);
  },
});
```

### Phase 2: Implement Core Resize Logic

#### 2.1 Create useResizeDrag Hook
**File**: `src/renderer/hooks/useResizeDrag.ts`

Following the pattern of `useRotationDrag`, implement:

```tsx
interface ResizeDragState {
  frameId: string;
  edge: 'top' | 'right' | 'bottom' | 'left';
  startBoundingBox: BoundingBox;
  startMousePosition: Point;
  containerElement: HTMLElement;
}

interface UseResizeDragProps {
  viewportFrames: ViewportFrame[];
  scaleFactors: ScaleFactors;
  onResizeChange: (frameId: string, newBoundingBox: BoundingBox) => void;
}
```

**Key functions**:
- `handleResizeStart`: Initialize drag state
- Global mouse move handler: Calculate new bounding box based on edge and mouse delta
- Global mouse up handler: End resize operation
- Edge-specific resize calculations

#### 2.2 Add Geometry Helper Functions
**File**: `src/renderer/utils/geometryUtils.ts`

**CRITICAL**: BoundingBox is already available via ViewportFrame import. The file already imports:
```tsx
import { ViewportFrame } from '@shared/types';
```

**Add BoundingBox to existing import:**
```tsx
import { ViewportFrame, BoundingBox } from '@shared/types';
```

**Add utility functions:**
```tsx
// Calculate new bounding box based on edge resize
export function calculateResizedBoundingBox(
  originalBox: BoundingBox,
  edge: 'top' | 'right' | 'bottom' | 'left',
  mouseDelta: Point,
  scaleFactors: ScaleFactors,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  const newBox = { ...originalBox };
  
  // Convert mouse delta from display coordinates to image coordinates
  const imageDeltaX = mouseDelta.x / scaleFactors.scaleX;
  const imageDeltaY = mouseDelta.y / scaleFactors.scaleY;
  
  switch (edge) {
    case 'top':
      newBox.y += imageDeltaY;
      newBox.height -= imageDeltaY;
      // Enforce minimum height
      if (newBox.height < minHeight) {
        newBox.y = originalBox.y + originalBox.height - minHeight;
        newBox.height = minHeight;
      }
      break;
      
    case 'right':
      newBox.width += imageDeltaX;
      // Enforce minimum width
      if (newBox.width < minWidth) {
        newBox.width = minWidth;
      }
      break;
      
    case 'bottom':
      newBox.height += imageDeltaY;
      // Enforce minimum height
      if (newBox.height < minHeight) {
        newBox.height = minHeight;
      }
      break;
      
    case 'left':
      newBox.x += imageDeltaX;
      newBox.width -= imageDeltaX;
      // Enforce minimum width
      if (newBox.width < minWidth) {
        newBox.x = originalBox.x + originalBox.width - minWidth;
        newBox.width = minWidth;
      }
      break;
  }
  
  return newBox;
}

// Validate bounding box constraints
export function validateBoundingBox(
  boundingBox: BoundingBox,
  imageWidth: number,
  imageHeight: number,
  minWidth: number = 20,
  minHeight: number = 20
): BoundingBox {
  const validated = { ...boundingBox };
  
  // Ensure minimum dimensions
  validated.width = Math.max(validated.width, minWidth);
  validated.height = Math.max(validated.height, minHeight);
  
  // Ensure within image boundaries
  validated.x = Math.max(0, Math.min(validated.x, imageWidth - validated.width));
  validated.y = Math.max(0, Math.min(validated.y, imageHeight - validated.height));
  
  // Ensure doesn't exceed image boundaries
  if (validated.x + validated.width > imageWidth) {
    validated.width = imageWidth - validated.x;
  }
  if (validated.y + validated.height > imageHeight) {
    validated.height = imageHeight - validated.y;
  }
  
  return validated;
}
```

### Phase 3: Wire Up Resize Functionality

#### 3.1 Update FramesOverlay Integration
**File**: `src/renderer/components/ImagePreview/FramesOverlay.tsx`

- Import and use `useResizeDrag` hook
- Wire up resize handlers
- Add `onResizeChange` prop to component interface
- Connect resize drag handlers to the hook

#### 3.2 Add Store Integration
**File**: `src/renderer/stores/imageStore.tsx`

**CRITICAL**: The store uses React Context pattern with useState, NOT Zustand's `set` function.

**Add this action to the ImageStoreContextType interface:**
```tsx
interface ImageStoreContextType extends ImageState {
  // ... existing actions
  updateViewportFrameBoundingBox: (frameId: string, newBoundingBox: BoundingBox) => void;
}
```

**Add this function inside ImageStoreProvider component:**
```tsx
const updateViewportFrameBoundingBox = useCallback(
  (frameId: string, newBoundingBox: BoundingBox) => {
    setState((prev) => ({
      ...prev,
      viewportPreviews: prev.viewportPreviews.map((preview) =>
        preview.viewportFrame?.id === frameId
          ? {
              ...preview,
              viewportFrame: {
                ...preview.viewportFrame,
                boundingBox: newBoundingBox,
              },
            }
          : preview
      ),
    }));
  },
  []
);
```

**Add to contextValue object:**
```tsx
const contextValue: ImageStoreContextType = {
  ...state,
  // ... existing actions
  updateViewportFrameBoundingBox,
};
```

**Add import for BoundingBox type:**
```tsx
import { BoundingBox } from '@shared/types';
```

#### 3.3 Update Parent Component
**File**: `src/renderer/components/ImagePreview/ImageBoard.tsx`

**No changes needed to ImageBoard.tsx** - FramesOverlay will handle resize operations directly through the store context, just like it already handles `addViewportPreview` and `removeViewportPreview`.

## Technical Implementation Details

### Edge Resize Logic
Each edge affects different bounding box properties:

- **Top edge**: 
  - Decreases `height` and increases `y` when dragged up
  - Increases `height` and decreases `y` when dragged down
  
- **Right edge**: 
  - Increases `width` when dragged right
  - Decreases `width` when dragged left
  
- **Bottom edge**: 
  - Increases `height` when dragged down
  - Decreases `height` when dragged up
  
- **Left edge**: 
  - Decreases `width` and increases `x` when dragged left
  - Increases `width` and decreases `x` when dragged right

### Coordinate System Handling
- All resize calculations work on the axis-aligned bounding box in image coordinates
- Scale factors are applied for display coordinate transformations
- Rotation is handled by the CSS transform, not by the resize logic

### Constraints
- Minimum dimensions: 20px x 20px (configurable)
- Maximum dimensions: Image boundaries
- Prevent negative dimensions
- Prevent bounding box from extending outside image bounds

## Implementation Notes for LLM

### Key Requirements
- Follow the exact phase order - each phase builds on the previous
- Use the existing `useRotationDrag` hook as a pattern for `useResizeDrag`
- Maintain consistency with existing code patterns and naming conventions
- Preserve all existing functionality while adding resize capability

### Critical Success Factors
- Edge handles must be easier to target than the current corner handles
- Resize operations must work smoothly with rotated frames
- All coordinate transformations must account for scale factors
- Minimum size constraints must be enforced to prevent unusable frames
- **Preview regeneration must work**: Resizing a frame must trigger `generateViewportPreviewIpc` and update the SubImageGrid with the new cropped image
- The complete data flow must work: UI → Store → IPC → Store → UI

### Code Patterns to Follow
- Use the same event handling pattern as rotation (global mouse listeners)
- Follow the same callback signature pattern as `onRotationChange`
- Use the same CSS module approach for styling
- Maintain the same data flow: UI → Hook → Store

### Common Implementation Pitfalls to Avoid
- Don't forget `event.stopPropagation()` on resize handles to prevent triggering rotation
- Always convert coordinates from display space to image space using scale factors
- Ensure minimum size constraints are applied before updating the store
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Remember to add cleanup for global event listeners in useEffect
- Test with rotated frames - the resize should still work on the axis-aligned bounding box
- **Don't forget the IPC call**: Resizing must trigger `updateViewportPreview()` to regenerate the cropped image
- **Verify the data flow**: Check that the new bounding box reaches `generateViewportPreviewIpc` correctly
- **Test preview updates**: Ensure SubImageGrid shows the updated preview after resize

### File Dependencies and Imports
- `useResizeDrag` hook needs: `ViewportFrame`, `BoundingBox` from `@shared/types`, helper functions from `geometryUtils`
- `FramesOverlay` needs: the new `useResizeDrag` hook, `updateViewportFrameBoundingBox` and `updateViewportPreview` from store context
- `geometryUtils` needs: `BoundingBox` added to existing `ViewportFrame` import from `@shared/types`
- Store (`imageStore.tsx`) needs: `BoundingBox` from `@shared/types`

### Validation Against Actual Codebase
- ✅ Store uses React Context + useState pattern (NOT Zustand)
- ✅ FramesOverlay is rendered in ImageBoard.tsx (NOT ImagePreview.tsx)
- ✅ Current handleResize signature only takes event and viewportFrame
- ✅ ViewportFrameOverlay already has corner resize handles that need to be replaced
- ✅ BoundingBox interface exists with x, y, width, height properties
- ✅ ScaleFactors interface and calculateScaleFactors function already exist
- ✅ Store already has updateViewportFrameRotation pattern to follow
- ✅ `updateViewportPreview()` exists and calls `generateViewportPreviewIpc`
- ✅ Rotation changes already trigger preview regeneration via `updateViewportPreview()`
- ✅ SubImageGrid displays viewport previews from store's `viewportPreviews` array
- ✅ `updateViewportPreview()` debounce and async systems are designed to handle sequential updates correctly 