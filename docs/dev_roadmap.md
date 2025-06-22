# Scan Prep - Development Roadmap

## Overview

This roadmap breaks down the image splitting application into **13 manageable phases**, each delivering working functionality that can be demonstrated, tested, and reviewed as an independent PR. Each phase builds incrementally toward the final application while maintaining a runnable state.

---

## 📋 Phase 1: Foundation Setup
**Goal:** Establish the basic Electron + React + TypeScript foundation with dark-themed 3-column layout

### Deliverables
- [ ] Electron application with TypeScript configuration
- [ ] React setup with Tailwind CSS dark theme
- [ ] Basic 3-column layout structure
- [ ] Window management and basic menu
- [ ] Development build pipeline

### Technical Tasks
```typescript
// Key files to create:
- src/main/main.ts                 // Electron entry point
- src/main/window-manager.ts       // Window creation/management
- src/renderer/App.tsx             // Main React component
- src/renderer/components/Layout/ThreeColumnLayout.tsx
- tailwind.config.js              // Dark theme configuration
- webpack.config.js               // Build configuration
```

### Acceptance Criteria
- ✅ Application launches with dark-themed window
- ✅ 3 clearly defined columns visible
- ✅ Responsive layout that adapts to window resizing
- ✅ Development hot-reload working
- ✅ TypeScript compilation without errors

### Demo
- Show application launching
- Demonstrate column layout and dark theme
- Show window resizing behavior

---

## 📂 Phase 2: Basic File Navigation
**Goal:** Implement basic directory navigation and file selection functionality

### Deliverables
- [ ] Directory path input with validation
- [ ] Basic file listing via IPC
- [ ] File selection (single image)
- [ ] Error handling for invalid paths

### Technical Tasks
```typescript
// New components:
- src/renderer/components/FileExplorer/PathInput.tsx
- src/renderer/components/FileExplorer/BasicFileList.tsx

// Main process services:
- src/main/services/FileManager.ts
- src/main/ipc-handlers.ts (basic file operations)

// IPC messages:
- 'file:read-directory'
- 'file:validate-path'
```

### Acceptance Criteria
- ✅ User can enter directory path and see validation
- ✅ File list displays supported image formats (JPEG, PNG, TIFF)
- ✅ File selection highlights the chosen image
- ✅ Error handling for invalid paths
- ✅ Basic IPC communication working

### Demo
- Navigate to different directories via path input
- Select various image files
- Demonstrate error handling for invalid paths

---

## 📁 Phase 3: Advanced File Explorer
**Goal:** Add advanced file navigation features and view options

### Deliverables
- [ ] Thumbnail/list view toggle
- [ ] Directory tree navigation
- [ ] Image file filtering and metadata
- [ ] Enhanced file list with details

### Technical Tasks
```typescript
// Updated components:
- src/renderer/components/FileExplorer/ViewToggle.tsx
- src/renderer/components/FileExplorer/DirectoryTree.tsx
- src/renderer/components/FileExplorer/EnhancedFileList.tsx

// Enhanced IPC messages:
- 'file:get-file-info'
- 'file:get-thumbnail'
```

### Acceptance Criteria
- ✅ Toggle between thumbnail and list views works
- ✅ Directory navigation (folders expand/collapse)
- ✅ File metadata display (size, date modified)
- ✅ Smooth transitions between view modes
- ✅ Thumbnail generation for image files

### Demo
- Show thumbnail vs list view toggle
- Navigate through directory tree
- Display file metadata and thumbnails

---

## 🖼️ Phase 4: Image Preview (Middle Column)
**Goal:** Display selected images with basic preview functionality

### Deliverables
- [ ] Image loading and display via IPC
- [ ] Empty state with "Select an image" message
- [ ] Image scaling and centering
- [ ] Basic error handling for corrupted images
- [ ] Loading states and progress indicators

### Technical Tasks
```typescript
// New components:
- src/renderer/components/ImagePreview/EmptyState.tsx
- src/renderer/components/ImagePreview/ImageDisplay.tsx
- src/renderer/components/ImagePreview/LoadingSpinner.tsx

// Main process updates:
- src/main/services/ImageProcessor.ts (basic loading)
- Add 'image:load' IPC handler

// State management:
- src/renderer/stores/imageStore.ts (basic image state)
```

### Acceptance Criteria
- ✅ Empty state shows when no image selected
- ✅ Selected image displays properly scaled and centered
- ✅ Loading indicator during image load
- ✅ Error message for unsupported/corrupted files
- ✅ Image fits within column boundaries
- ✅ Handles large images without memory issues

### Demo
- Select images from file explorer
- Show different image sizes and formats
- Demonstrate error handling
- Show loading states

---

## ✂️ Phase 5: Basic Image Detection ✅
**Goal:** Implement basic automatic sub-image detection with simple overlays

### Deliverables
- [x] "Analyze" button in middle column
- [x] Basic computer vision pipeline for sub-image detection
- [x] Simple green overlay rectangles showing detected regions
- [x] Progress indication for analysis operation

### Technical Tasks
```typescript
// Updated components:
- src/renderer/components/ImagePreview/AnalyzeButton.tsx
- src/renderer/components/ImagePreview/BasicDetectionOverlay.tsx

// Main process analysis logic:
- src/main/services/ImageAnalysisService.ts (basic detection)
- Add 'image:analyze' IPC handler

// Shared types:
- src/shared/types.ts (DetectedSubImage, AnalysisResult interfaces)

// Basic computer vision pipeline:
- Edge detection and contour finding
- Rectangular region filtering
```

### Acceptance Criteria
- ✅ "Analyze" button triggers computer vision analysis
- ✅ Green overlay rectangles appear over detected sub-images
- ✅ Analysis completes within reasonable time (< 15 seconds)
- ✅ Progress indicator shows during analysis
- ✅ Basic detection results are stored

### Demo
- Show analysis of scanned documents
- Demonstrate basic detection overlays
- Show progress indication
- Verify basic detection functionality

---

## 🔍 Phase 6: Advanced Detection Features
**Goal:** Add dynamic rotation detection and confidence scoring

### Deliverables
- [ ] Dynamic rotation detection for each sub-image
- [ ] Enhanced overlay with rotation indicators
- [ ] Confidence scoring system
- [ ] Improved detection accuracy and performance

### Technical Tasks
```typescript
// Enhanced components:
- src/renderer/components/ImagePreview/AdvancedDetectionOverlay.tsx
- src/renderer/components/ImagePreview/RotationIndicator.tsx

// Enhanced analysis logic:
- src/main/services/ImageAnalysisService.ts (rotation detection)
- Rotation angle detection algorithms
- Confidence scoring implementation
```

### Acceptance Criteria
- ✅ Each rectangle shows correct rotation (not just 90° increments)
- ✅ Rotation indicators visible on overlay rectangles
- ✅ Confidence scores calculated for each detection
- ✅ False positive detection rate is acceptably low
- ✅ Enhanced performance optimization

### Demo
- Show detection of rotated sub-images
- Demonstrate rotation indicators on overlays
- Show confidence scoring in action
- Verify improved detection accuracy

---

## 🔲 Phase 7: Basic Extraction and Grid
**Goal:** Extract detected regions and display basic previews in right column

### Deliverables
- [ ] Basic sub-image extraction (cropping)
- [ ] Right column grid showing extracted image previews
- [ ] Empty state with "Analyze an image" message
- [ ] Grid layout that adapts to number of detections

### Technical Tasks
```typescript
// New components:
- src/renderer/components/SubImageGrid/EmptyState.tsx
- src/renderer/components/SubImageGrid/BasicExtractedPreview.tsx
- src/renderer/components/SubImageGrid/GridContainer.tsx

// Basic extraction logic:
- src/main/services/ImageAnalysisService.ts (basic extraction)
- Add 'image:extract-subimage' IPC handler
```

### Acceptance Criteria
- ✅ Empty state shows before any analysis
- ✅ Extracted sub-images display in grid after analysis
- ✅ Grid adapts to variable number of detected images
- ✅ Basic extraction (cropping) works correctly
- ✅ Grid scrolls properly when needed

### Demo
- Show empty state initially
- Analyze an image and see extracted previews populate
- Demonstrate adaptive grid layout
- Show basic extraction functionality

---

## 🎯 Phase 8: Advanced Image Correction
**Goal:** Add rotation correction, perspective correction, and confidence indicators

### Deliverables
- [ ] Rotation correction during extraction
- [ ] Perspective correction for skewed documents
- [ ] Confidence indicators for each detection
- [ ] Low-confidence detection warnings

### Technical Tasks
```typescript
// Enhanced components:
- src/renderer/components/SubImageGrid/EnhancedPreview.tsx
- src/renderer/components/SubImageGrid/ConfidenceIndicator.tsx

// Advanced correction algorithms:
- src/main/services/ImageAnalysisService.ts (correction methods)
- Rotation correction implementation
- Perspective correction algorithms
```

### Acceptance Criteria
- ✅ Images are properly rotated during extraction
- ✅ Perspective correction applied to skewed documents
- ✅ Confidence scores visible for each detection
- ✅ Low-confidence detections clearly marked
- ✅ Lossless quality maintained during correction

### Demo
- Show rotation and perspective correction
- Demonstrate confidence indicators
- Show low-confidence detection handling
- Verify correction quality

---

## 🔄 Phase 9: Detection Refinement and Manual Adjustment
**Goal:** Allow users to refine automatic detections and add manual regions

### Deliverables
- [ ] Click-to-select detection rectangles
- [ ] Manual rotation adjustment for selected regions
- [ ] Add/remove detection regions manually
- [ ] Real-time preview updates when adjusting
- [ ] Re-analyze button for processing changes

### Technical Tasks
```typescript
// Updated components:
- src/renderer/components/ImagePreview/InteractiveOverlay.tsx
- src/renderer/components/ImagePreview/ManualControls.tsx
- src/renderer/components/SubImageGrid/PreviewUpdater.tsx

// Manual adjustment logic:
- src/main/services/ImageAnalysisService.ts (manual region handling)
- Add 'image:adjust-detection' IPC handler
- Add 'image:add-manual-region' IPC handler

// Interactive features:
- Click and drag to adjust rectangles
- Rotation handles on selected regions
- Add new region tool
```

### Acceptance Criteria
- ✅ Click to select detection rectangles
- ✅ Drag handles to resize selected regions
- ✅ Rotation control for fine-tuning angles
- ✅ Add new detection regions manually
- ✅ Delete unwanted detections
- ✅ Real-time preview updates in right column

### Demo
- Select and adjust detection rectangles
- Fine-tune rotation angles manually
- Add missing regions the algorithm didn't detect
- Show real-time preview updates

---

## 💾 Phase 10: Export Functionality
**Goal:** Implement saving individual and batch export capabilities for extracted images

### Deliverables
- [ ] Save button for individual extracted sub-images
- [ ] "Save All" button for batch export
- [ ] Smart file naming based on detection order
- [ ] Save location selection
- [ ] Export progress and confirmation

### Technical Tasks
```typescript
// Updated components:
- src/renderer/components/SubImageGrid/ExtractedImageActions.tsx (save button)
- src/renderer/components/SubImageGrid/BatchActions.tsx (save all)

// Export logic:
- src/main/services/ExportManager.ts
- Add 'export:save-extracted-image' and 'export:save-all-extracted' IPC handlers

// File naming:
- Smart naming based on detection position and confidence
- Handle duplicate names gracefully
```

### Acceptance Criteria
- ✅ Individual save button opens file dialog
- ✅ "Save All" opens folder selection dialog
- ✅ Files saved with logical naming (detected-1.jpg, detected-2.jpg, etc.)
- ✅ Progress indication for batch saves
- ✅ Success/error feedback for save operations
- ✅ Handles save conflicts gracefully

### Demo
- Save individual extracted images
- Demonstrate "Save All" functionality
- Show intelligent file naming
- Test error handling (permissions, disk space)

---

## ⚙️ Phase 11: Analysis Modes
**Goal:** Implement multiple detection algorithms with user-selectable modes

### Deliverables
- [ ] Multiple detection algorithms (conservative/balanced/aggressive)
- [ ] Analysis mode selection UI
- [ ] Algorithm performance comparison
- [ ] Mode-specific configuration options

### Technical Tasks
```typescript
// Analysis mode components:
- src/renderer/components/ImagePreview/AnalysisModeSelector.tsx
- src/renderer/components/Settings/AnalysisSettings.tsx

// Multiple algorithm implementations:
- src/main/services/ImageAnalysisService.ts (mode-specific algorithms)
- Conservative detection algorithm
- Balanced detection algorithm  
- Aggressive detection algorithm
```

### Acceptance Criteria
- ✅ Multiple analysis modes available (conservative/balanced/aggressive)
- ✅ Mode selection UI is intuitive and clear
- ✅ Different algorithms produce varying detection results
- ✅ Performance comparison data available
- ✅ Mode settings persist between sessions

### Demo
- Show different analysis algorithm modes
- Compare detection results between modes
- Demonstrate mode selection interface
- Show performance differences

---

## 📦 Phase 12: Batch Processing
**Goal:** Process multiple images in sequence with queue management

### Deliverables
- [ ] Process multiple images in sequence
- [ ] Batch analysis queue with progress tracking
- [ ] Queue management (add/remove/reorder)
- [ ] Batch results summary

### Technical Tasks
```typescript
// Batch processing components:
- src/renderer/components/BatchProcessor/QueueManager.tsx
- src/renderer/components/BatchProcessor/BatchProgress.tsx
- src/renderer/components/BatchProcessor/ResultsSummary.tsx

// Batch processing logic:
- src/main/services/BatchProcessor.ts
- Queue management system
- Progress tracking for multiple files
- Batch results aggregation
```

### Acceptance Criteria
- ✅ Multiple images can be queued for processing
- ✅ Progress tracking shows current image and overall progress
- ✅ Queue can be managed (add/remove/reorder items)
- ✅ Batch results summary shows success/failure rates
- ✅ Memory management handles multiple large images

### Demo
- Add multiple images to processing queue
- Show progress tracking during batch processing
- Demonstrate queue management features
- Display batch results summary

---

## ✨ Phase 13: UI Polish & Final Features
**Goal:** Final user experience improvements and performance optimization

### Deliverables
- [ ] Keyboard shortcuts for common actions
- [ ] Drag & drop file support
- [ ] Final animations and polish
- [ ] Performance optimization for large images

### Technical Tasks
```typescript
// Final UX improvements:
- Keyboard navigation and shortcuts
- Drag & drop handlers
- Loading animations and transitions
- Accessibility improvements

// Performance optimizations:
- Image caching strategies
- Memory leak prevention
- Large file handling improvements
- UI responsiveness optimization
```

### Acceptance Criteria
- ✅ Keyboard shortcuts work (Ctrl+A for analyze, Ctrl+S for save)
- ✅ Drag & drop images from file system
- ✅ Smooth performance with large scans (>20MB)
- ✅ Professional, polished user interface
- ✅ All animations and transitions are smooth
- ✅ Accessibility standards met

### Demo
- Show keyboard shortcuts in action
- Demonstrate drag & drop functionality
- Test with very large scanned documents
- Show final polished experience
- Verify accessibility features

This roadmap ensures steady progress with deliverable milestones at each phase, making the development process manageable and reviewable while building toward a complete, professional image splitting application. 