import { promises as fs } from 'fs';
import * as path from 'path';
import { DirectoryEntry, FileValidationResult, APP_CONSTANTS, EnhancedFileInfo } from '@shared/types';

export class FileManager {
  /**
   * Constructor
   */
  constructor() {
    // Service is ready to use
  }

  /**
   * Reads a directory and returns its contents
   * @param dirPath The directory path to read
   * @returns Array of directory entries
   */
  async readDirectory(dirPath: string): Promise<DirectoryEntry[]> {
    try {
      const files = await fs.readdir(dirPath);
      const entries: DirectoryEntry[] = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stats = await fs.stat(filePath);
          const ext = path.extname(file).toLowerCase();
          const isSupported = this.isSupportedImageFormat(ext);

          entries.push({
            name: file,
            path: filePath,
            isDirectory: stats.isDirectory(),
            isSupported,
            size: stats.size,
            lastModified: stats.mtime
          });
        } catch (error) {
          // Skip files we can't stat (permissions, etc)
          console.warn(`Unable to stat file: ${filePath}`, error);
        }
      }

      // Sort: directories first, then by name
      return entries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates a path and returns whether it's valid
   * @param inputPath The path to validate
   * @returns Validation result with error message if invalid
   */
  async validatePath(inputPath: string): Promise<FileValidationResult> {
    try {
      const normalizedPath = path.normalize(inputPath);
      const stats = await fs.stat(normalizedPath);

      if (!stats.isDirectory()) {
        return {
          isValid: false,
          error: 'Path is not a directory'
        };
      }

      // Try to read the directory to ensure we have permissions
      await fs.readdir(normalizedPath);

      return {
        isValid: true
      };
    } catch (error) {
      if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          return {
            isValid: false,
            error: 'Directory does not exist'
          };
        }
        if (nodeError.code === 'EACCES') {
          return {
            isValid: false,
            error: 'Permission denied'
          };
        }
      }
      return {
        isValid: false,
        error: `Invalid path: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Checks if a file extension is a supported image format
   * @param ext The file extension (including the dot)
   * @returns Whether the extension is supported
   */
  private isSupportedImageFormat(ext: string): boolean {
    return APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(ext as typeof APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS[number]);
  }

  /**
   * Get enhanced file information including metadata
   * @param filePath The path to the file
   * @returns Enhanced file information or null if error
   */
  async getEnhancedFileInfo(filePath: string): Promise<EnhancedFileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const isSupported = this.isSupportedImageFormat(ext);
      const fileName = path.basename(filePath);

      const fileInfo: EnhancedFileInfo = {
        name: fileName,
        path: filePath,
        isDirectory: stats.isDirectory(),
        isSupported,
        size: stats.size,
        lastModified: stats.mtime,
        fileType: ext.slice(1).toUpperCase(),
        mimeType: this.getMimeType(ext)
      };

      // If it's a supported image, try to get dimensions
      if (isSupported && !stats.isDirectory()) {
        const dimensions = await this.getImageDimensions(filePath);
        if (dimensions) {
          fileInfo.imageMetadata = {
            width: dimensions.width,
            height: dimensions.height,
            format: ext.slice(1).toUpperCase(),
            hasAlpha: ext === '.png' // Simplified check
          };
          fileInfo.dimensions = dimensions;
        }
      }

      return fileInfo;
    } catch (error) {
      console.error('Error getting enhanced file info:', error);
      return null;
    }
  }

  /**
   * Get MIME type from file extension
   * @param ext The file extension
   * @returns MIME type string
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get basic image dimensions (placeholder implementation)
   * @param filePath Path to the image file
   * @returns Dimensions or null
   */
  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
    try {
      // This is a placeholder implementation
      // In production, you would use a library like sharp or image-size
      const stats = await fs.stat(filePath);
      
      // For now, return estimated dimensions based on file size
      // This is NOT accurate and should be replaced with proper image parsing
      if (stats.size < 100000) { // < 100KB
        return { width: 400, height: 300 };
      } else if (stats.size < 1000000) { // < 1MB
        return { width: 800, height: 600 };
      } else if (stats.size < 5000000) { // < 5MB
        return { width: 1920, height: 1080 };
      } else {
        return { width: 3840, height: 2160 };
      }
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }
} 