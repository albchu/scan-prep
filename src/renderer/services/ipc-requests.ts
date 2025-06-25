import { IPC_CHANNELS } from '@shared/constants';
import {
  DirectoryEntry,
  FileValidationResult,
  EnhancedFileInfo,
  ImageLoadResult,
  ViewportFrameResult,
  ViewportFrame,
  AnalysisOptions,
} from '@shared/types';

// Ensure we have access to the electronAPI type
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

// File system operations
export const readDirectoryIpc = async (path: string): Promise<DirectoryEntry[]> => {
  return window.electronAPI.invoke(IPC_CHANNELS.FILE_READ_DIRECTORY, path);
};

export const validatePathIpc = async (path: string): Promise<FileValidationResult> => {
  return window.electronAPI.invoke(IPC_CHANNELS.FILE_VALIDATE_PATH, path);
};

export const getFileInfoIpc = async (filePath: string): Promise<EnhancedFileInfo | null> => {
  return window.electronAPI.invoke(IPC_CHANNELS.FILE_GET_FILE_INFO, filePath);
};

// Image operations
export const loadImageIpc = async (imagePath: string): Promise<ImageLoadResult> => {
  return window.electronAPI.invoke(IPC_CHANNELS.IMAGE_LOAD, imagePath);
};

export const generateViewportFrameIpc = async (
  imagePath: string,
  clickX: number,
  clickY: number,
  options?: Partial<AnalysisOptions>
): Promise<ViewportFrameResult> => {
  return window.electronAPI.invoke(
    IPC_CHANNELS.GENERATE_VIEWPORT_FRAME,
    imagePath,
    clickX,
    clickY,
    options
  );
};

export const generateViewportPreviewIpc = async (
  imagePath: string,
  viewportFrame: ViewportFrame,
  previewSize?: { width: number; height: number }
): Promise<ViewportFrameResult> => {
  return window.electronAPI.invoke(
    IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW,
    imagePath,
    viewportFrame,
    previewSize
  );
}; 