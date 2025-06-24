import { AnalysisOptions } from './types';

export const IPC_CHANNELS = {
  FILE_GET_FILE_INFO: 'file:get-file-info',
  FILE_READ_DIRECTORY: 'file:read-directory',
  FILE_VALIDATE_PATH: 'file:validate-path',
  GENERATE_VIEWPORT_PREVIEW: 'image:generate-viewport-preview',
  GENERATE_VIEWPORT_FRAME: 'image:generate-viewport-frame',
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

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  backgroundColor: 'white',
  minAreaThreshold: 2500, // ~50x50 pixels minimum
  minDimensionThreshold: 30, // At least 30 pixels in smallest dimension
};

export const MAX_FRAME_PREVIEW_DIMENSION = 200;