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
}

// Phase 4: Image operations
export interface ImageOperations {
  'image:load': (path: string) => Promise<ImageLoadResult>;
}

// Add Phase 4 IPC channels
export const IMAGE_IPC_CHANNELS = {
  IMAGE_LOAD: 'image:load',
} as const; 