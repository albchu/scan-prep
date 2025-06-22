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
  viewMode: 'thumbnail' | 'list';
  
  // UI state
  errorMessage: string | null;
  successMessage: string | null;
}

// IPC message types for Phase 1 - will be expanded in later phases
export interface FileOperations {
  'file:read-directory': (path: string) => Promise<DirectoryEntry[]>;
  'file:validate-path': (path: string) => Promise<boolean>;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSupported?: boolean; // For image files
  size?: number;
  lastModified?: Date;
}

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
  THUMBNAIL_SIZE: 150,
  PREVIEW_MAX_WIDTH: 800,
  PREVIEW_MAX_HEIGHT: 600,
} as const;

export type SupportedImageFormat = typeof APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS[number]; 