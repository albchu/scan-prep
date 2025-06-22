# Scan Prep - Implementation Details

## Overview

This document contains the detailed technical specifications, TypeScript interfaces, and implementation examples for the Scan Prep image splitting application. This supplements the high-level technical design with concrete implementation guidance.

## Core Type Definitions

### Image Analysis Types

```typescript
interface DetectedSubImage {
  id: string;
  boundingBox: BoundingBox;
  rotation: number; // Dynamic rotation in degrees (-180 to 180)
  confidence: number; // Detection confidence (0-1)
  extractedImage?: ArrayBuffer;
  manuallyAdjusted: boolean;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnalysisResult {
  detectedImages: DetectedSubImage[];
  analysisTime: number;
  originalDimensions: { width: number; height: number };
}

interface AnalysisMode {
  name: 'conservative' | 'balanced' | 'aggressive';
  confidenceThreshold: number;  // 0.8, 0.6, 0.4
  edgeDetectionSensitivity: number;
  minRegionSize: number;
  maxRegionCount: number;
}
```

### Export and Processing Types

```typescript
interface ExtractedImage {
  id: string;
  originalDetection: DetectedSubImage;
  processedImageData: ArrayBuffer;
  filename: string;
}

interface DetectionAdjustments {
  boundingBox?: BoundingBox;
  rotation?: number;
  manualOverride?: boolean;
}

interface BatchAnalysisResult {
  results: AnalysisResult[];
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
}

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSupported?: boolean; // For image files
  size?: number;
  lastModified?: Date;
}
```

## IPC Message Definitions

### File Operations

```typescript
interface FileOperations {
  'file:read-directory': (path: string) => Promise<DirectoryEntry[]>;
  'file:validate-path': (path: string) => Promise<boolean>;
  'file:load-image': (path: string) => Promise<ArrayBuffer>;
  'file:get-image-metadata': (path: string) => Promise<ImageMetadata>;
}
```

### Image Analysis Operations

```typescript
interface ImageAnalysisOperations {
  'image:analyze': (
    imageData: ArrayBuffer, 
    analysisMode?: AnalysisMode
  ) => Promise<AnalysisResult>;
  
  'image:extract-subimage': (
    imageData: ArrayBuffer, 
    detection: DetectedSubImage
  ) => Promise<ArrayBuffer>;
  
  'image:adjust-detection': (
    detectionId: string, 
    adjustments: DetectionAdjustments
  ) => Promise<DetectedSubImage>;
  
  'image:add-manual-region': (
    imageData: ArrayBuffer, 
    region: BoundingBox
  ) => Promise<DetectedSubImage>;
  
  'image:remove-detection': (detectionId: string) => Promise<boolean>;
}
```

### Export Operations

```typescript
interface ExportOperations {
  'export:save-extracted-image': (
    imageData: ArrayBuffer, 
    path: string
  ) => Promise<boolean>;
  
  'export:save-all-extracted': (
    extractedImages: ExtractedImage[], 
    basePath: string
  ) => Promise<string[]>;
  
  'export:show-save-dialog': (
    defaultName?: string
  ) => Promise<string | null>;
  
  'export:show-folder-dialog': () => Promise<string | null>;
}
```

## State Management

### Application State Interface

```typescript
interface AppState {
  // File navigation state
  currentDirectory: string;
  selectedImage: string | null;
  viewMode: 'thumbnail' | 'list';
  
  // Analysis state
  currentAnalysis: AnalysisResult | null;
  detectedImages: DetectedSubImage[];
  selectedDetection: string | null;
  analysisMode: AnalysisMode;
  
  // Processing state
  extractedImages: ExtractedImage[];
  processingState: 'idle' | 'analyzing' | 'extracting' | 'saving';
  progressPercent: number;
  
  // UI state
  errorMessage: string | null;
  successMessage: string | null;
}
```

### State Actions

```typescript
interface AppActions {
  // File operations
  setCurrentDirectory: (path: string) => void;
  setSelectedImage: (imagePath: string | null) => void;
  setViewMode: (mode: 'thumbnail' | 'list') => void;
  
  // Analysis operations
  setAnalysisResult: (result: AnalysisResult | null) => void;
  updateDetection: (detection: DetectedSubImage) => void;
  removeDetection: (detectionId: string) => void;
  setSelectedDetection: (detectionId: string | null) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  
  // Processing operations
  setExtractedImages: (images: ExtractedImage[]) => void;
  setProcessingState: (state: AppState['processingState']) => void;
  setProgress: (percent: number) => void;
  
  // UI operations
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
  clearMessages: () => void;
}
```

## Service Interface Definitions

### Image Analysis Service

```typescript
interface ImageAnalysisService {
  // Core analysis methods
  analyzeImage(
    imageBuffer: ArrayBuffer, 
    mode?: AnalysisMode
  ): Promise<AnalysisResult>;
  
  extractSubImage(
    originalImage: ArrayBuffer, 
    detection: DetectedSubImage
  ): Promise<ArrayBuffer>;
  
  // Manual adjustment methods
  adjustDetection(
    detection: DetectedSubImage, 
    adjustments: DetectionAdjustments
  ): Promise<DetectedSubImage>;
  
  addManualRegion(
    imageBuffer: ArrayBuffer, 
    region: BoundingBox
  ): Promise<DetectedSubImage>;
  
  removeDetection(detectionId: string): Promise<boolean>;
  
  // Batch operations
  batchAnalyze(imagePaths: string[]): Promise<BatchAnalysisResult>;
}
```

### File Manager Service

```typescript
interface FileManagerService {
  // Directory operations
  readDirectory(path: string): Promise<DirectoryEntry[]>;
  validatePath(path: string): Promise<boolean>;
  
  // Image operations
  loadImage(path: string): Promise<ArrayBuffer>;
  getImageMetadata(path: string): Promise<ImageMetadata>;
  
  // File system utilities
  isImageFile(filename: string): boolean;
  getFileExtension(filename: string): string;
  sanitizePath(path: string): string;
}
```

### Export Manager Service

```typescript
interface ExportManagerService {
  // Individual export
  saveImage(
    imageData: ArrayBuffer, 
    outputPath: string, 
    format?: ImageFormat
  ): Promise<boolean>;
  
  // Batch export
  saveAllImages(
    images: ExtractedImage[], 
    outputDirectory: string
  ): Promise<string[]>;
  
  // Dialog operations
  showSaveDialog(defaultName?: string): Promise<string | null>;
  showFolderDialog(): Promise<string | null>;
  
  // Naming utilities
  generateFileName(
    detection: DetectedSubImage, 
    originalName: string, 
    index: number
  ): string;
  
  ensureUniqueFileName(
    directory: string, 
    fileName: string
  ): string;
}
```

## Component Interface Definitions

### File Explorer Component Props

```typescript
interface FileExplorerProps {
  currentDirectory: string;
  selectedImage: string | null;
  viewMode: 'thumbnail' | 'list';
  onDirectoryChange: (path: string) => void;
  onImageSelect: (imagePath: string) => void;
  onViewModeChange: (mode: 'thumbnail' | 'list') => void;
}

interface PathInputProps {
  value: string;
  onChange: (path: string) => void;
  onValidation: (isValid: boolean) => void;
}

interface FileListProps {
  files: DirectoryEntry[];
  selectedFile: string | null;
  viewMode: 'thumbnail' | 'list';
  onFileSelect: (filePath: string) => void;
}
```

### Image Preview Component Props

```typescript
interface ImagePreviewProps {
  selectedImage: string | null;
  analysisResult: AnalysisResult | null;
  selectedDetection: string | null;
  analysisMode: AnalysisMode;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onDetectionSelect: (detectionId: string) => void;
  onDetectionAdjust: (
    detectionId: string, 
    adjustments: DetectionAdjustments
  ) => void;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
}

interface DetectionOverlayProps {
  detections: DetectedSubImage[];
  selectedDetection: string | null;
  imageScale: number;
  onDetectionSelect: (detectionId: string) => void;
  onDetectionMove: (detectionId: string, newPosition: BoundingBox) => void;
  onDetectionResize: (detectionId: string, newSize: BoundingBox) => void;
}
```

### Sub-Image Grid Component Props

```typescript
interface SubImageGridProps {
  extractedImages: ExtractedImage[];
  detections: DetectedSubImage[];
  isExtracting: boolean;
  onExtractImages: () => void;
  onSaveImage: (imageId: string) => void;
  onSaveAll: () => void;
}

interface ExtractedImagePreviewProps {
  image: ExtractedImage;
  detection: DetectedSubImage;
  onSave: (imageId: string) => void;
}
```

## Configuration and Constants

### Analysis Mode Configurations

```typescript
const ANALYSIS_MODES: Record<string, AnalysisMode> = {
  conservative: {
    name: 'conservative',
    confidenceThreshold: 0.8,
    edgeDetectionSensitivity: 0.3,
    minRegionSize: 15000,
    maxRegionCount: 10
  },
  balanced: {
    name: 'balanced',
    confidenceThreshold: 0.6,
    edgeDetectionSensitivity: 0.5,
    minRegionSize: 10000,
    maxRegionCount: 15
  },
  aggressive: {
    name: 'aggressive',
    confidenceThreshold: 0.4,
    edgeDetectionSensitivity: 0.7,
    minRegionSize: 5000,
    maxRegionCount: 25
  }
};
```

### File Type Definitions

```typescript
const SUPPORTED_IMAGE_FORMATS = [
  '.jpg', '.jpeg', '.png', '.tiff', '.tif'
] as const;

type SupportedImageFormat = typeof SUPPORTED_IMAGE_FORMATS[number];

interface ImageMetadata {
  width: number;
  height: number;
  format: SupportedImageFormat;
  fileSize: number;
  colorDepth: number;
  hasAlpha: boolean;
}
```

### Application Constants

```typescript
const APP_CONSTANTS = {
  MIN_DETECTION_SIZE: 5000,        // Minimum pixels for valid detection
  MAX_IMAGE_SIZE: 50 * 1024 * 1024, // 50MB max file size
  ANALYSIS_TIMEOUT: 30000,         // 30 second timeout for analysis
  THUMBNAIL_SIZE: 150,             // Thumbnail dimensions
  PREVIEW_MAX_WIDTH: 800,          // Preview max width
  PREVIEW_MAX_HEIGHT: 600,         // Preview max height
  
  // UI Constants
  OVERLAY_COLOR: '#00ff00',        // Green overlay color
  OVERLAY_OPACITY: 0.3,            // Overlay transparency
  SELECTION_COLOR: '#ff6b35',      // Selected detection color
  LOW_CONFIDENCE_THRESHOLD: 0.5,   // Warning threshold
  
  // Export Constants
  DEFAULT_EXPORT_FORMAT: 'jpeg',   // Default save format
  EXPORT_QUALITY: 95,              // Export quality (1-100)
  BATCH_EXPORT_DELAY: 100,         // Delay between batch exports (ms)
} as const;
```

## Error Handling

### Error Types

```typescript
interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

const ERROR_CODES = {
  // File system errors
  INVALID_PATH: 'INVALID_PATH',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  
  // Image processing errors
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  INVALID_DETECTION: 'INVALID_DETECTION',
  
  // Export errors
  SAVE_FAILED: 'SAVE_FAILED',
  INVALID_OUTPUT_PATH: 'INVALID_OUTPUT_PATH',
  DISK_FULL: 'DISK_FULL',
  
  // General errors
  MEMORY_ERROR: 'MEMORY_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;
```

### Error Handler Interface

```typescript
interface ErrorHandler {
  handleError(error: AppError): void;
  createError(code: string, message: string, details?: any): AppError;
  isRetryableError(error: AppError): boolean;
  getErrorMessage(error: AppError): string;
}
```

This implementation details document provides the concrete specifications needed to build the application while keeping the main technical design focused on high-level architecture and concepts. 