// Window management types
export interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

export interface WindowOptions extends WindowBounds {
  minWidth?: number;
  minHeight?: number;
  show?: boolean;
  title?: string;
}

// Basic application state types for Phase 1
export interface AppState {
  // File navigation state
  currentDirectory: string;
  selectedImage: string | null;
  viewMode: 'list';
  
  // UI state
  errorMessage: string | null;
  successMessage: string | null;
}

// Phase 2: Enhanced file navigation types
export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSupported?: boolean; // For image files
  size?: number;
  lastModified?: Date;
  // Phase 3: Enhanced metadata
  fileType?: string;
  dimensions?: { width: number; height: number };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  entries?: DirectoryEntry[];
}

// Phase 3: View mode types
export type ViewMode = 'list';

export interface ViewState {
  mode: ViewMode;
  showHidden: boolean;
  sortBy: 'name' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';
}

// Phase 3: Enhanced file info
export interface EnhancedFileInfo extends DirectoryEntry {
  mimeType?: string;
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
    hasAlpha: boolean;
  };
}

// IPC message types for file operations
export interface FileOperations {
  'file:read-directory': (path: string) => Promise<DirectoryEntry[]>;
  'file:validate-path': (path: string) => Promise<FileValidationResult>;
  // Phase 3: Enhanced operations
  'file:get-file-info': (path: string) => Promise<EnhancedFileInfo | null>;
}

// IPC channel definitions for type safety
export const IPC_CHANNELS = {
  FILE_READ_DIRECTORY: 'file:read-directory',
  FILE_VALIDATE_PATH: 'file:validate-path',
  // Phase 3: New channels
  FILE_GET_FILE_INFO: 'file:get-file-info',
} as const;

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const ERROR_CODES = {
  // File system errors
  INVALID_PATH: 'INVALID_PATH',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Application constants
export const APP_CONSTANTS = {
  MIN_WINDOW_WIDTH: 1200,
  MIN_WINDOW_HEIGHT: 800,
  DEFAULT_WINDOW_WIDTH: 1400,
  DEFAULT_WINDOW_HEIGHT: 900,
  
  // Supported file formats
  SUPPORTED_IMAGE_FORMATS: ['.jpg', '.jpeg', '.png', '.tiff', '.tif'] as const,
  
  // UI Constants
  PREVIEW_MAX_WIDTH: 800,
  PREVIEW_MAX_HEIGHT: 600,
  
  // Phase 3: Enhanced UI constants
  VIEW_MODES: {
    LIST: 'list' as const,
  },
} as const;

export type SupportedImageFormat = typeof APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS[number];

// Phase 4: Image loading types
export interface ImageLoadResult {
  success: boolean;
  data?: {
    base64: string;
    width: number;
    height: number;
    format: string;
    size: number;
  };
  error?: string;
}

export interface ImageState {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  imageData: ImageLoadResult['data'] | null;
  selectedPath: string | null;
  viewportPreviews: ViewportPreviewResult[];
}

// Phase 4: Image operations
export interface ImageOperations {
  'image:load': (path: string) => Promise<ImageLoadResult>;
}

// Add Phase 4 IPC channels
export const IMAGE_IPC_CHANNELS = {
  IMAGE_LOAD: 'image:load',
} as const;

// Phase 5: Image analysis types
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Enhanced DetectedSubImage that supports user-controlled rotation
export interface DetectedSubImage {
  id: string;
  boundingBox: BoundingBox; // Initial axis-aligned bounding box from detection
  userRotation: number; // User-applied rotation in degrees (0 by default)
  confidence: number; // 0-1 confidence score
  area: number; // pixel area
}

export interface AnalysisResult {
  success: boolean;
  detectedImages: DetectedSubImage[];
  analysisTime: number; // milliseconds
  error?: string;
  imageWidth: number;
  imageHeight: number;
}

export interface AnalysisOptions {
  backgroundColor: 'white' | 'black' | 'auto'; // Scanner background
  minAreaThreshold: number; // Minimum area in pixels to consider
  minDimensionThreshold: number; // Minimum width or height in pixels
  confidenceThreshold: number; // Minimum confidence to include
  edgeSensitivity: number; // 0-1, higher = more sensitive
}

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  backgroundColor: 'white',
  minAreaThreshold: 2500, // ~50x50 pixels minimum
  minDimensionThreshold: 30, // At least 30 pixels in smallest dimension
  confidenceThreshold: 0.3,
  edgeSensitivity: 0.5,
};

// Phase 5: Analysis operations
export interface AnalysisOperations {
  'image:analyze-click': (imagePath: string, clickX: number, clickY: number, options?: Partial<AnalysisOptions>) => Promise<AnalysisResult>;
}

// Add Phase 5 IPC channels
export const ANALYSIS_IPC_CHANNELS = {
  IMAGE_ANALYZE_CLICK: 'image:analyze-click',
} as const;

// User-driven analysis types
export interface ClickCoordinate {
  x: number;
  y: number;
}

export interface UserDetectedSubImage extends DetectedSubImage {
  clickPoint: ClickCoordinate;
  detectionMethod: 'automated' | 'user-click';
}

export interface UserAnalysisResult extends Omit<AnalysisResult, 'detectedImages'> {
  detectedImages: UserDetectedSubImage[];
  clickPoints: ClickCoordinate[];
}

// Viewport preview types for sub-image extraction
export interface ViewportPreviewResult {
  success: boolean;
  id: string;
  base64?: string;
  width?: number;
  height?: number;
  originalDetection: DetectedSubImage;
  error?: string;
}

export interface ViewportOperations {
  'image:generate-viewport-preview': (
    imagePath: string, 
    detection: DetectedSubImage,
    previewSize: { width: number; height: number }
  ) => Promise<ViewportPreviewResult>;
}

// Add viewport IPC channels
export const VIEWPORT_IPC_CHANNELS = {
  GENERATE_VIEWPORT_PREVIEW: 'image:generate-viewport-preview',
} as const; 