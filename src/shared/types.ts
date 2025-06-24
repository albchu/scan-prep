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
  viewportPreviews: ViewportFrameResult[];
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
  viewportFrames: ViewportFrame[];
  analysisTime: number; // milliseconds
  error?: string;
  imageWidth: number;
  imageHeight: number;
}

export interface ViewportFrameResult {
  success: boolean;
  base64?: string;
  viewportFrame: ViewportFrame;
  error?: string;
} 

export interface AnalysisOptions {
  backgroundColor: 'white' | 'black' | 'auto'; // Scanner background
  minAreaThreshold: number; // Minimum area in pixels to consider
  minDimensionThreshold: number; // Minimum width or height in pixels
}
