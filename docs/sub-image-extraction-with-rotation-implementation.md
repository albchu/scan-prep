# Sub-Image Viewport Preview Implementation Guide

## Overview

This document outlines the implementation approach for displaying viewport previews of detected sub-image regions in the right panel grid. The feature builds on the existing interactive overlay system to provide real-time visual previews of what's inside each detection frame, including proper rotation handling.

## Current State Analysis

### Existing Components
- **InteractiveDetectionOverlay.tsx**: Handles rotation controls and visual overlay rendering
- **ImageDisplayWithAnalysis.tsx**: Manages click detection and rotation state
- **SubImageGridPlaceholder.tsx**: Currently shows placeholder content
- **ImageAnalysisService.ts**: Provides click-based boundary detection

### Key Data Structures
```typescript
interface DetectedSubImage {
  id: string;
  boundingBox: BoundingBox; // Initial axis-aligned bounding box
  userRotation: number; // User-applied rotation in degrees
  confidence: number;
  area: number;
}
```

## Implementation Architecture

### 1. Viewport Rendering Service

**File**: `src/main/services/ImageAnalysisService.ts`

**New Methods**:
```typescript
/**
 * Generate viewport preview for a detected region
 * @param imagePath - Source image path
 * @param detection - Detection with rotation information
 * @param previewSize - Target size for the preview (e.g., 200x200)
 * @returns Base64 encoded viewport preview
 */
async generateViewportPreview(
  imagePath: string, 
  detection: DetectedSubImage,
  previewSize: { width: number; height: number }
): Promise<ViewportPreviewResult>
```

**Algorithm Approach**:
1. **Load Source Image**: Use `image-js` to load the original image
2. **Calculate Rotated Viewport Bounds**: Determine the exact region covered by the rotated overlay frame
3. **Extract Expanded Region**: Crop a larger region that encompasses the rotated frame
4. **Apply Counter-Rotation**: Rotate the cropped region by negative userRotation to straighten content
5. **Crop to Final Viewport**: Extract the center region that represents the straightened viewport content
6. **Scale to Preview Size**: Resize to fit the grid thumbnail dimensions
7. **Encode Result**: Convert to base64 for renderer display

### 2. IPC Channel Additions

**File**: `src/shared/types.ts`

**New Types**:
```typescript
interface ViewportPreviewResult {
  success: boolean;
  id: string;
  base64?: string;
  width?: number;
  height?: number;
  originalDetection: DetectedSubImage;
  error?: string;
}

interface ViewportOperations {
  'image:generate-viewport-preview': (
    imagePath: string, 
    detection: DetectedSubImage,
    previewSize: { width: number; height: number }
  ) => Promise<ViewportPreviewResult>;
}

// Add to existing IPC channels
export const VIEWPORT_IPC_CHANNELS = {
  GENERATE_VIEWPORT_PREVIEW: 'image:generate-viewport-preview',
} as const;
```

**File**: `src/main/ipc-handlers.ts`

**New Handlers**:
```typescript
// Handle viewport preview generation
ipcMain.handle(VIEWPORT_IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW, 
  async (event, imagePath: string, detection: DetectedSubImage, previewSize: { width: number; height: number }) => {
    return await this.imageAnalysisService.generateViewportPreview(imagePath, detection, previewSize);
  }
);
```

**File**: `src/main/preload.ts`

**Add to allowed channels**:
```typescript
const allowedChannels = [
  'file:read-directory',
  'file:validate-path',
  'file:get-file-info',
  'image:load',
  'image:analyze-click',
  'image:generate-viewport-preview', // Add this line
];
```

### 3. State Management Enhancement

**File**: `src/renderer/stores/imageStore.ts`

**Enhanced State**:
```typescript
// Extend existing ImageState interface in src/shared/types.ts
interface ImageState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  imageData: ImageLoadResult['data'] | null;
  selectedPath: string | null;
  // Add viewport preview state
  viewportPreviews: ViewportPreviewResult[];
}

// Generate viewport preview
const generateViewportPreview = async (imagePath: string, detection: DetectedSubImage) => {
  try {
    const result = await window.electronAPI.invoke(
      VIEWPORT_IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW,
      imagePath,
      detection,
      { width: 200, height: 200 }
    );
    
    if (result.success) {
      setViewportPreviews(prev => 
        prev.some(p => p.id === detection.id)
          ? prev.map(p => p.id === detection.id ? result : p)
          : [...prev, result]
      );
    }
  } catch (error) {
    console.error('Failed to generate viewport preview:', error);
  }
};
```

### 4. Grid Components Implementation

**File**: `src/renderer/components/SubImageGrid/SubImageGrid.tsx`

**New Main Grid Component**:
```typescript
interface SubImageGridProps {
  viewportPreviews: ViewportPreviewResult[];
}

export const SubImageGrid: React.FC<SubImageGridProps> = ({
  viewportPreviews
}) => {
  if (viewportPreviews.length === 0) {
    return <SubImageGridPlaceholder />;
  }

  return (
    <div className="sub-image-grid">
      <div className="grid-header">
        <h3>Detected Regions ({viewportPreviews.length})</h3>
      </div>
      <div className="grid-container">
        {viewportPreviews.map((preview) => (
          <ViewportPreview
            key={preview.id}
            viewportPreview={preview}
          />
        ))}
      </div>
    </div>
  );
};
```

**File**: `src/renderer/components/SubImageGrid/ViewportPreview.tsx`

**Individual Viewport Preview**:
```typescript
interface ViewportPreviewProps {
  viewportPreview: ViewportPreviewResult;
}

export const ViewportPreview: React.FC<ViewportPreviewProps> = ({
  viewportPreview
}) => {
  const { base64, width, height, originalDetection } = viewportPreview;
  
  return (
    <div className="viewport-preview">
      <div className="preview-container">
        <img 
          src={base64} 
          alt={`Viewport preview ${originalDetection.id}`}
          className="preview-image"
        />
        

      </div>
      
      <div className="preview-info">
        <span className="dimensions">{width}×{height}px</span>
        {Math.abs(originalDetection.userRotation) > 1 && (
          <span className="rotation-indicator">
            ↻ {Math.round(originalDetection.userRotation)}°
          </span>
        )}
        <span className="confidence">
          {Math.round(originalDetection.confidence * 100)}%
        </span>
      </div>
    </div>
  );
};
```

### 5. Integration with Existing Components

**File**: `src/renderer/components/ImagePreview/ImageDisplayWithAnalysis.tsx`

**Enhanced Integration**:
```typescript
// Generate viewport previews when detections change
useEffect(() => {
  const allDetections = clickDetections.flatMap(d => d.detectedImages);
  allDetections.forEach(detection => {
    if (imagePath) {
      generateViewportPreview(imagePath, detection);
    }
  });
}, [clickDetections, imagePath]);

// Update viewport preview on rotation change
const handleRotationChange = useCallback((detectionId: string, newRotation: number) => {
  // Update detection state
  setClickDetections(prev => prev.map(result => ({
    ...result,
    detectedImages: result.detectedImages.map(detection => 
      detection.id === detectionId 
        ? { ...detection, userRotation: newRotation }
        : detection
    )
  })));
  
  // Update the specific viewport preview
  const updatedDetection = clickDetections
    .flatMap(d => d.detectedImages)
    .find(d => d.id === detectionId);
    
  if (updatedDetection && imagePath) {
    generateViewportPreview(imagePath, {
      ...updatedDetection,
      userRotation: newRotation
    });
  }
}, [clickDetections, imagePath]);
```

**File**: `src/renderer/App.tsx`

**App-Level Integration**:
```typescript
const App: React.FC = () => {
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
  const { viewportPreviews } = useImageStore();

  return (
    <div className="app-container">
      <AppProvider onFileSelect={handleFileSelect}>
        <ThreeColumnLayout
          leftColumn={<FileExplorer />}
          middleColumn={<ImagePreview selectedImage={selectedImagePath} />}
          rightColumn={<SubImageGrid viewportPreviews={viewportPreviews} />}
          // ... other props
        />
      </AppProvider>
    </div>
  );
};
```

## Technical Implementation Details

### Viewport Calculation Mathematics

The viewport preview algorithm handles rotated overlay frames:

```typescript
/**
 * Calculate rotated corner coordinates (import from InteractiveDetectionOverlay)
 */
function calculateRotatedCorners(
  boundingBox: BoundingBox, 
  rotationDegrees: number
): Point[] {
  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;
  
  const angleRad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  const halfWidth = boundingBox.width / 2;
  const halfHeight = boundingBox.height / 2;
  
  return [
    { x: -halfWidth, y: -halfHeight }, // Top-left
    { x: halfWidth, y: -halfHeight },  // Top-right
    { x: halfWidth, y: halfHeight },   // Bottom-right
    { x: -halfWidth, y: halfHeight },  // Bottom-left
  ].map(corner => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
}

/**
 * Calculate expanded region that encompasses the rotated overlay frame
 */
function calculateExpandedRegion(
  boundingBox: BoundingBox, 
  rotationDegrees: number,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  // Get the rotated corners of the overlay frame
  const corners = calculateRotatedCorners(boundingBox, rotationDegrees);
  
  // Find the minimum bounding rectangle that contains all corners
  const minX = Math.max(0, Math.min(...corners.map(c => c.x)));
  const minY = Math.max(0, Math.min(...corners.map(c => c.y)));
  const maxX = Math.min(imageWidth, Math.max(...corners.map(c => c.x)));
  const maxY = Math.min(imageHeight, Math.max(...corners.map(c => c.y)));
  
  // Add padding to ensure we capture enough content for rotation
  const padding = Math.max(boundingBox.width, boundingBox.height) * 0.2;
  
  return {
    x: Math.round(Math.max(0, minX - padding)),
    y: Math.round(Math.max(0, minY - padding)),
    width: Math.round(Math.min(imageWidth, maxX + padding) - Math.max(0, minX - padding)),
    height: Math.round(Math.min(imageHeight, maxY + padding) - Math.max(0, minY - padding))
  };
}

/**
 * Generate viewport preview with content straightened (counter-rotated)
 */
async function generateViewportPreview(
  sourceImage: Image,
  detection: DetectedSubImage,
  previewSize: { width: number; height: number }
): Promise<string> {
  // Calculate expanded region that encompasses the rotated frame
  const expandedRegion = calculateExpandedRegion(
    detection.boundingBox,
    detection.userRotation,
    sourceImage.width,
    sourceImage.height
  );
  
  // Crop the expanded region
  const croppedImage = sourceImage.crop({
    x: expandedRegion.x,
    y: expandedRegion.y,
    width: expandedRegion.width,
    height: expandedRegion.height
  });
  
  // Apply counter-rotation to straighten the content (negative of user rotation)
  const straightenedImage = croppedImage.rotate(-detection.userRotation);
  
  // Calculate the center region that represents the original bounding box content
  const centerX = (straightenedImage.width - detection.boundingBox.width) / 2;
  const centerY = (straightenedImage.height - detection.boundingBox.height) / 2;
  
  // Crop to the final viewport size
  const finalViewport = straightenedImage.crop({
    x: Math.round(centerX),
    y: Math.round(centerY),
    width: detection.boundingBox.width,
    height: detection.boundingBox.height
  });
  
  // Scale to preview size while maintaining aspect ratio
  const scaledImage = finalViewport.resize({
    width: previewSize.width,
    height: previewSize.height
  });
  
  // Convert to base64
  return scaledImage.toDataURL();
}
```

### Performance Considerations

1. **Debounced Updates**: Debounce rotation changes to avoid excessive preview regeneration
2. **Thumbnail Caching**: Cache generated viewport previews to avoid reprocessing
3. **Memory Management**: Dispose of image objects after processing

### Error Handling

```typescript
interface ViewportPreviewError {
  type: 'INVALID_VIEWPORT' | 'ROTATION_FAILED' | 'SCALING_FAILED';
  message: string;
  detectionId: string;
}
```

## CSS Styling Requirements

**File**: `src/renderer/styles.css`

```css
.sub-image-grid {
  @apply flex flex-col h-full;
}

.grid-header {
  @apply p-4 border-b border-dark-700;
}

.grid-container {
  @apply flex-1 p-4 overflow-auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.viewport-preview {
  @apply bg-dark-800 rounded-lg overflow-hidden;
}

.preview-container {
  @apply relative aspect-square bg-dark-700 flex items-center justify-center;
}

.preview-image {
  @apply max-w-full max-h-full object-contain rounded;
}



.preview-info {
  @apply p-2 text-xs text-dark-300 space-y-1;
}

.rotation-indicator {
  @apply text-orange-400;
}

.confidence {
  @apply text-green-400;
}
```

## Testing Strategy

### Critical Tests
- Counter-rotation produces upright content for rotated overlays
- Viewport previews match expected content within detection frames
- Real-time preview updates when rotation changes

### Implementation Tests
- IPC communication for viewport generation (verify preload channel whitelist)
- ImageAnalysisService viewport generation with image-js
- State management updates (add/update previews)
- Integration with existing rotation math from InteractiveDetectionOverlay

## Development Phases

### Phase 1: Core Backend
1. Add `generateViewportPreview` method to ImageAnalysisService with counter-rotation logic
2. Add IPC handler for viewport generation to ipc-handlers.ts
3. Add 'image:generate-viewport-preview' to allowed channels in preload.ts
4. Test with rotated detection frames

### Phase 2: Frontend Grid
1. Create `SubImageGrid` and `ViewportPreview` components
2. Update App.tsx to use SubImageGrid in right column
3. Extend ImageState interface in shared/types.ts to include viewportPreviews
4. Add basic CSS styling

### Phase 3: Integration
1. Update imageStore.ts to include viewport preview state and generation function
2. Connect viewport generation to detection creation/rotation in ImageDisplayWithAnalysis
3. Test real-time preview updates

## Success Criteria

- [ ] Viewport previews are generated and displayed in real-time as overlays are created
- [ ] Grid layout adapts to varying numbers of detected regions
- [ ] Rotation changes update the corresponding viewport preview immediately
- [ ] **Content within viewport previews is always shown upright/straightened regardless of overlay rotation**
- [ ] Performance remains smooth with multiple viewport previews
- [ ] Previews accurately represent the straightened content that would be extracted from the rotated overlay frames 