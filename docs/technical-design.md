# Scan Prep - Technical Design Proposal

## Overview

Scan Prep is an Electron-based desktop application designed specifically for **splitting scanned images** into smaller segments. The application features a **3-column dark-themed interface** that allows users to navigate files, preview images, split them into sub-images, and export the results with simple rotation capabilities.

## Technology Stack

### Core Framework
- **Electron**: Cross-platform desktop application framework
- **TypeScript**: Type-safe JavaScript development
- **Node.js**: Backend runtime environment

### Image Processing
- **image-js**: Primary image processing library for JavaScript
- **Canvas API**: Browser-native rendering for image display and manipulation

### Frontend
- **React**: Component-based UI framework
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development with dark theme support
- **Electron React Boilerplate**: Development setup and configuration

### Development Tools
- **Webpack**: Module bundling and build optimization
- **ESLint + Prettier**: Code quality and formatting
- **Jest**: Unit testing framework
- **Spectron**: End-to-end testing for Electron apps

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────┐
│            Main Process             │
│  (Node.js + Electron Main Thread)  │
├─────────────────────────────────────┤
│  • File System Operations          │
│  • Menu Management                 │
│  • Window Management               │
│  • IPC Communication Hub           │
└─────────────────────────────────────┘
                    │
                    │ IPC
                    │
┌─────────────────────────────────────┐
│          Renderer Process          │
│     (Chromium + React + TS)        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │     3-Column UI Layout          ││
│  │  • File Explorer (Left)         ││
│  │  • Image Preview (Middle)       ││
│  │  • Sub-Image Grid (Right)       ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │    Image Splitting Layer        ││
│  │  • image-js Integration         ││
│  │  • Split Operations             ││
│  │  • Rotation Operations          ││
│  │  • Export Logic                 ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Project Structure

```
scan-prep/
├── src/
│   ├── main/                    # Main process code
│   │   ├── main.ts             # Application entry point
│   │   ├── menu.ts             # Application menu
│   │   ├── window-manager.ts   # Window management
│   │   └── ipc-handlers.ts     # IPC communication handlers
│   ├── renderer/               # Renderer process code
│   │   ├── components/         # React components
│   │   │   ├── FileExplorer/   # Left column - file navigation
│   │   │   ├── ImagePreview/   # Middle column - image preview & split
│   │   │   ├── SubImageGrid/   # Right column - split results
│   │   │   └── Layout/         # 3-column layout wrapper
│   │   ├── services/           # Business logic
│   │   │   ├── ImageSplitter.ts # Core splitting functionality
│   │   │   ├── FileManager.ts   # File system operations
│   │   │   └── ExportManager.ts # Save/export operations
│   │   ├── hooks/              # React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── App.tsx             # Main React component
│   └── shared/                 # Shared code between processes
│       ├── types.ts
│       └── constants.ts
├── assets/                     # Static assets
├── build/                      # Build configuration
├── dist/                       # Built application
├── docs/                       # Documentation
├── mockups/                    # UI mockups and wireframes
└── tests/                      # Test files
```

## Core Features and Modules

### 1. File Navigation and Management
- **Directory Path Input**: Manual path entry with validation
- **View Modes**: Toggle between thumbnail and list view
- **File Support**: JPEG, PNG, TIFF formats
- **Directory Tree**: Expandable/collapsible folder navigation
- **File Selection**: Single image selection for processing

### 2. Image Splitting Pipeline

#### Core Splitting Module (`ImageSplitter.ts`)
```typescript
interface ImageSplitter {
  // Split operations
  splitImage(imageBuffer: ArrayBuffer, splitPattern: SplitPattern): Promise<SubImage[]>
  
  // Basic operations on sub-images
  rotateSubImage(subImage: SubImage, angle: number): Promise<SubImage>
  
  // Export operations
  saveSubImage(subImage: SubImage, path: string): Promise<boolean>
  saveAllSubImages(subImages: SubImage[], basePath: string): Promise<boolean>
}

interface SplitPattern {
  rows: number;
  columns: number;
  preserveAspectRatio?: boolean;
}

interface SubImage {
  id: string;
  imageData: ArrayBuffer;
  originalPosition: { row: number; column: number };
  rotation: number; // 0, 90, 180, 270
  dimensions: { width: number; height: number };
}
```

#### Image Splitting Features
- **Grid-based Splitting**: Divide images into equal segments (2x2, 3x3, etc.)
- **Visual Split Preview**: Show split lines on the main image
- **Sub-image Generation**: Create individual image segments
- **Rotation**: 90-degree rotation for sub-images
- **Batch Export**: Save all sub-images simultaneously

### 3. User Interface Components

#### Column 1: File Explorer Component (`FileExplorer/`)
- **Path Input Field**: 
  - Text input for directory path entry
  - Path validation and error handling
  - Auto-completion support
- **View Toggle Buttons**:
  - Thumbnail view with image previews
  - List view with file names
- **Directory Tree**:
  - Hierarchical folder navigation
  - File filtering for supported formats
  - Click-to-select functionality

#### Column 2: Image Preview Component (`ImagePreview/`)
- **Empty State**:
  - Centered icon and "Select an image" text
  - Clean, minimal design
- **Image Display**:
  - Centered image with proper scaling
  - Split grid overlay visualization
  - Responsive to window size
- **Split Controls**:
  - Prominent "Split" button
  - Split pattern selection (2x2, 3x3, etc.)
  - Progress indication during processing

#### Column 3: Sub-Image Grid Component (`SubImageGrid/`)
- **Empty State**:
  - Centered icon and "Analyze an image" text
  - Consistent with Column 2 styling
- **Sub-Image Grid**:
  - Responsive grid layout (2x2, 3x3, etc.)
  - Thumbnail previews of split segments
  - Individual action buttons per sub-image
- **Action Controls**:
  - Rotate button (🔄) for 90-degree rotation
  - Save button (💾) for individual export
  - "Save All" button for batch export

### 4. Dark Theme Implementation
```typescript
// Tailwind CSS dark theme configuration
const darkTheme = {
  colors: {
    background: {
      primary: '#1f1f1f',    // Main background
      secondary: '#2d2d2d',  // Panel backgrounds
      tertiary: '#3a3a3a'    // Elevated elements
    },
    text: {
      primary: '#ffffff',    // Primary text
      secondary: '#d4d4d4',  // Secondary text
      muted: '#9ca3af'       // Muted text
    },
    border: {
      default: '#404040',    // Default borders
      hover: '#525252'       // Hover state borders
    }
  }
}
```

## Image Processing Integration

### image-js Implementation Strategy

```typescript
// Core image splitting service
import { Image } from 'image-js'

class ImageSplittingService {
  async splitImage(
    imageBuffer: ArrayBuffer, 
    pattern: SplitPattern
  ): Promise<SubImage[]> {
    const image = await Image.load(imageBuffer)
    const subImages: SubImage[] = []
    
    const segmentWidth = Math.floor(image.width / pattern.columns)
    const segmentHeight = Math.floor(image.height / pattern.rows)
    
    for (let row = 0; row < pattern.rows; row++) {
      for (let col = 0; col < pattern.columns; col++) {
        const x = col * segmentWidth
        const y = row * segmentHeight
        
        const subImage = image.crop({
          x,
          y,
          width: segmentWidth,
          height: segmentHeight
        })
        
        subImages.push({
          id: `${row}-${col}`,
          imageData: await subImage.toBuffer(),
          originalPosition: { row, column: col },
          rotation: 0,
          dimensions: { width: segmentWidth, height: segmentHeight }
        })
      }
    }
    
    return subImages
  }
  
  async rotateSubImage(subImage: SubImage): Promise<SubImage> {
    const image = await Image.load(subImage.imageData)
    const rotated = image.rotate(90)
    
    return {
      ...subImage,
      imageData: await rotated.toBuffer(),
      rotation: (subImage.rotation + 90) % 360,
      dimensions: {
        width: subImage.dimensions.height,
        height: subImage.dimensions.width
      }
    }
  }
}
```

### Processing Pipeline Architecture

1. **Image Loading**: Load selected image from file system
2. **Split Preview**: Display visual grid overlay on image
3. **Split Processing**: Generate sub-images based on grid pattern
4. **Sub-Image Display**: Render thumbnails in grid layout
5. **Individual Operations**: Rotate or save specific sub-images
6. **Batch Export**: Save all sub-images with naming convention

## Performance Considerations

### Memory Management
- **Efficient Splitting**: Process image segments without loading full image multiple times
- **Thumbnail Generation**: Create optimized thumbnails for grid display
- **Memory Cleanup**: Proper disposal of image objects after processing
- **Lazy Loading**: Load sub-images only when needed

### User Experience
- **Progress Indicators**: Show splitting progress for large images
- **Responsive UI**: Maintain smooth interactions during processing
- **Error Handling**: Graceful handling of unsupported files or processing errors
- **File Size Limits**: Reasonable limits to prevent memory issues

## Data Flow and IPC Communication

### Why IPC is Essential

Electron applications run in **two isolated processes** for security and stability:

- **Renderer Process** (React UI): Runs in a sandboxed browser environment with no direct file system access
- **Main Process** (Node.js): Has full system access but cannot directly manipulate the DOM

**IPC (Inter-Process Communication) is required because:**
1. **File Operations**: React components cannot read directories or load images directly
2. **Security**: Browser security model prevents direct file system access from UI code  
3. **Image Processing**: Heavy operations are better handled in the main process to avoid UI blocking
4. **File Saving**: Export operations require Node.js file system APIs unavailable to the renderer

For this image splitting application, the renderer handles UI interactions while the main process manages all file I/O, making IPC the essential bridge between user actions and system operations.

### IPC Message Types
```typescript
interface IPCMessages {
  // File operations
  'file:read-directory': (path: string) => Promise<DirectoryEntry[]>
  'file:validate-path': (path: string) => Promise<boolean>
  'file:load-image': (path: string) => Promise<ArrayBuffer>
  
  // Image processing
  'image:split': (imageData: ArrayBuffer, pattern: SplitPattern) => Promise<SubImage[]>
  'image:rotate': (subImageId: string, imageData: ArrayBuffer) => Promise<ArrayBuffer>
  
  // Export operations
  'export:save-image': (imageData: ArrayBuffer, path: string) => Promise<boolean>
  'export:save-all': (subImages: SubImage[], basePath: string) => Promise<string[]>
}
```

### State Management
```typescript
interface AppState {
  currentDirectory: string
  selectedImage: string | null
  splitPattern: SplitPattern
  subImages: SubImage[]
  viewMode: 'thumbnail' | 'list'
  processingState: 'idle' | 'splitting' | 'saving'
}
```

## Future Enhancements

### Phase 2 Features
- **Custom Split Patterns**: Non-uniform grid patterns
- **Split Templates**: Predefined patterns for common use cases
- **Batch Processing**: Process multiple images simultaneously
- **Export Formats**: Additional output formats (WebP, PDF)

### UI Enhancements
- **Column Resizing**: Adjustable column widths
- **Keyboard Shortcuts**: Power user keyboard navigation
- **Drag & Drop**: Direct file dropping support
- **Preview Zoom**: Zoom controls for detailed image inspection

## Conclusion

This revised technical design focuses specifically on the image splitting workflow with a clean, dark-themed 3-column interface. The simplified feature set ensures optimal performance and user experience while maintaining the flexibility for future enhancements.

The combination of Electron, TypeScript, and image-js provides a solid foundation for building this specialized image processing tool that meets the specific requirements of users who need to split scanned images into manageable segments. 