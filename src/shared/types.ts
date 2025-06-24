export interface WindowOptions {
  x?: number;
  y?: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  show?: boolean;
  title?: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSupported?: boolean; // For image files
  size?: number;
  lastModified?: Date;
  fileType?: string;
  dimensions?: { width: number; height: number };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  entries?: DirectoryEntry[];
}

export interface EnhancedFileInfo extends DirectoryEntry {
  mimeType?: string;
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
    hasAlpha: boolean;
  };
}

export const IPC_CHANNELS = {
  FILE_GET_FILE_INFO: 'file:get-file-info',
  FILE_READ_DIRECTORY: 'file:read-directory',
  FILE_VALIDATE_PATH: 'file:validate-path',
  GENERATE_VIEWPORT_PREVIEW: 'image:generate-viewport-preview',
  IMAGE_ANALYZE_CLICK: 'image:analyze-click',
  IMAGE_LOAD: 'image:load',
} as const;

export const ERROR_CODES = {
  INVALID_PATH: 'INVALID_PATH',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  ACCESS_DENIED: 'ACCESS_DENIED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  DIRECTORY_NOT_FOUND: 'DIRECTORY_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export const APP_CONSTANTS = {
  MIN_WINDOW_WIDTH: 1200,
  MIN_WINDOW_HEIGHT: 800,
  DEFAULT_WINDOW_WIDTH: 1400,
  DEFAULT_WINDOW_HEIGHT: 900,
  SUPPORTED_IMAGE_FORMATS: ['.jpg', '.jpeg', '.png', '.tiff', '.tif'] as const,
} as const;

export type SupportedImageFormat = typeof APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS[number];

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

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportFrame {
  id: string;
  boundingBox: BoundingBox; // Axis-aligned bounding box from detection
  rotation: number; // User-applied rotation in degrees (0 by default)
  area: number; // pixel area
}

export interface AnalysisResult {
  success: boolean;
  detectedImages: ViewportFrame[];
  analysisTime: number; // milliseconds
  error?: string;
  imageWidth: number;
  imageHeight: number;
}

export interface AnalysisOptions {
  backgroundColor: 'white' | 'black' | 'auto'; // Scanner background
  minAreaThreshold: number; // Minimum area in pixels to consider
  minDimensionThreshold: number; // Minimum width or height in pixels
}

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  backgroundColor: 'white',
  minAreaThreshold: 2500, // ~50x50 pixels minimum
  minDimensionThreshold: 30, // At least 30 pixels in smallest dimension
};

export interface ViewportPreviewResult {
  success: boolean;
  id: string;
  base64?: string;
  width?: number;
  height?: number;
  viewportFrame: ViewportFrame;
  error?: string;
} 