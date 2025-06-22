import { promises as fs } from 'fs';
import path from 'path';
import { DirectoryEntry, FileValidationResult, APP_CONSTANTS } from '@shared/types';

export class FileManager {
  private readonly supportedExtensions: Set<string>;

  constructor() {
    // Create a set of supported extensions for efficient lookup
    this.supportedExtensions = new Set(
      APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS.map(ext => ext.toLowerCase())
    );
  }

  /**
   * Validates if a given path exists and is a directory
   */
  async validatePath(directoryPath: string): Promise<FileValidationResult> {
    try {
      // Normalize the path
      const normalizedPath = path.resolve(directoryPath);
      
      // Check if path exists
      const stats = await fs.stat(normalizedPath);
      
      if (!stats.isDirectory()) {
        return {
          isValid: false,
          error: 'Path is not a directory'
        };
      }

      // Try to read the directory to ensure we have permissions
      const entries = await this.readDirectory(normalizedPath);
      
      return {
        isValid: true,
        entries
      };
    } catch (error) {
      console.error('Path validation error:', error);
      
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          isValid: false,
          error: 'Directory does not exist'
        };
      }
      
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        return {
          isValid: false,
          error: 'Permission denied'
        };
      }
      
      return {
        isValid: false,
        error: 'Invalid directory path'
      };
    }
  }

  /**
   * Reads a directory and returns entries with image file support information
   */
  async readDirectory(directoryPath: string): Promise<DirectoryEntry[]> {
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      const directoryEntries: DirectoryEntry[] = [];

      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        
        try {
          const stats = await fs.stat(fullPath);
          const isDirectory = entry.isDirectory();
          
          // Determine if this is a supported image file
          const isSupported = !isDirectory && this.isImageFile(entry.name);

          directoryEntries.push({
            name: entry.name,
            path: fullPath,
            isDirectory,
            isSupported,
            size: stats.size,
            lastModified: stats.mtime
          });
        } catch (statError) {
          // Skip entries that can't be accessed
          console.warn(`Could not stat file ${fullPath}:`, statError);
          continue;
        }
      }

      // Sort entries: directories first, then supported images, then other files
      return directoryEntries.sort((a, b) => {
        // Directories first
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        
        // Among files, supported images first
        if (!a.isDirectory && !b.isDirectory) {
          if (a.isSupported && !b.isSupported) return -1;
          if (!a.isSupported && b.isSupported) return 1;
        }
        
        // Alphabetical within same category
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
    } catch (error) {
      console.error('Directory read error:', error);
      
      const errorCode = (error as NodeJS.ErrnoException).code;
      switch (errorCode) {
        case 'ENOENT':
          throw new Error(`Directory not found: ${directoryPath}`);
        case 'EACCES':
          throw new Error(`Permission denied: ${directoryPath}`);
        case 'ENOTDIR':
          throw new Error(`Not a directory: ${directoryPath}`);
        default:
          throw new Error(`Failed to read directory: ${directoryPath}`);
      }
    }
  }

  /**
   * Checks if a filename has a supported image extension
   */
  private isImageFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedExtensions.has(ext);
  }

  /**
   * Gets file information for a specific path
   */
  async getFileInfo(filePath: string): Promise<DirectoryEntry | null> {
    try {
      const stats = await fs.stat(filePath);
      const filename = path.basename(filePath);
      
      return {
        name: filename,
        path: filePath,
        isDirectory: stats.isDirectory(),
        isSupported: !stats.isDirectory() && this.isImageFile(filename),
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('File info error:', error);
      return null;
    }
  }
} 