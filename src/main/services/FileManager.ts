import { promises as fs } from 'fs';
import path from 'path';
import { DirectoryEntry, FileValidationResult, APP_CONSTANTS, EnhancedFileInfo, ThumbnailOptions } from '@shared/types';

export class FileManager {
  private readonly supportedExtensions: Set<string>;
  private thumbnailCache: Map<string, { data: string; timestamp: number }>;

  constructor() {
    // Create a set of supported extensions for efficient lookup
    this.supportedExtensions = new Set(
      APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS.map(ext => ext.toLowerCase())
    );
    
    // Initialize thumbnail cache
    this.thumbnailCache = new Map();
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

  /**
   * Gets enhanced file information including image metadata
   */
  async getEnhancedFileInfo(filePath: string): Promise<EnhancedFileInfo | null> {
    try {
      const stats = await fs.stat(filePath);
      const filename = path.basename(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      const baseInfo: EnhancedFileInfo = {
        name: filename,
        path: filePath,
        isDirectory: stats.isDirectory(),
        isSupported: !stats.isDirectory() && this.isImageFile(filename),
        size: stats.size,
        lastModified: stats.mtime,
        fileType: ext
      };

      // For supported image files, get additional metadata
      if (baseInfo.isSupported && !baseInfo.isDirectory) {
        try {
          const imageMetadata = await this.getImageMetadata(filePath);
          if (imageMetadata) {
            baseInfo.imageMetadata = imageMetadata;
            baseInfo.dimensions = {
              width: imageMetadata.width,
              height: imageMetadata.height
            };
          }
        } catch (metadataError) {
          console.warn('Could not get image metadata for', filePath, metadataError);
        }
      }

      return baseInfo;
    } catch (error) {
      console.error('Enhanced file info error:', error);
      return null;
    }
  }

  /**
   * Generates thumbnail for an image file
   */
  async generateThumbnail(filePath: string, options: ThumbnailOptions = { size: APP_CONSTANTS.THUMBNAIL_SIZE }): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = `${filePath}-${options.size}`;
      const cached = this.thumbnailCache.get(cacheKey);
      if (cached) {
        // Check if cache is still valid (1 hour)
        const now = Date.now();
        const maxAge = 60 * 60 * 1000; // 1 hour
        if (now - cached.timestamp < maxAge) {
          return cached.data;
        }
      }

      // Verify file exists and is supported
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo || !fileInfo.isSupported) {
        return null;
      }

      // Generate thumbnail using Canvas API (simplified approach)
      const thumbnail = await this.createThumbnailCanvas(filePath, options.size);
      
      // Cache the result
      if (thumbnail) {
        this.thumbnailCache.set(cacheKey, {
          data: thumbnail,
          timestamp: Date.now()
        });
      }

      return thumbnail;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null;
    }
  }

  /**
   * Creates a thumbnail using Canvas API (simplified placeholder)
   */
  private async createThumbnailCanvas(filePath: string, size: number): Promise<string | null> {
    try {
      // Verify file exists and is a supported image
      const stats = await fs.stat(filePath);
      if (stats.size > 50 * 1024 * 1024) { // Skip files larger than 50MB
        console.warn('File too large for thumbnail generation:', filePath);
        return null;
      }

      // For development purposes, create a simple colored rectangle as a placeholder
      // In production, you would use libraries like sharp, canvas, or image-js for real thumbnails
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      
      // Create a simple SVG placeholder thumbnail
      const svgThumbnail = this.createSVGPlaceholder(filename, ext, size);
      return `data:image/svg+xml;base64,${Buffer.from(svgThumbnail).toString('base64')}`;
    } catch (error) {
      console.error('Canvas thumbnail creation error:', error);
      return null;
    }
  }

  /**
   * Creates an SVG placeholder thumbnail
   */
  private createSVGPlaceholder(filename: string, ext: string, size: number): string {
    const colors: Record<string, string> = {
      '.jpg': '#4f46e5',
      '.jpeg': '#4f46e5',
      '.png': '#059669',
      '.tiff': '#dc2626',
      '.tif': '#dc2626'
    };
    
    const color = colors[ext] || '#6b7280';
    const shortName = filename.length > 12 ? filename.substring(0, 9) + '...' : filename;
    
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${color}20" stroke="${color}" stroke-width="2" rx="4"/>
        <text x="50%" y="40%" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          📷
        </text>
        <text x="50%" y="60%" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif" font-size="8">
          ${ext.toUpperCase()}
        </text>
        <text x="50%" y="75%" text-anchor="middle" fill="${color}80" font-family="Arial, sans-serif" font-size="6">
          ${shortName}
        </text>
      </svg>
    `;
  }

  /**
   * Gets image metadata (placeholder implementation)
   */
  private async getImageMetadata(filePath: string): Promise<{ width: number; height: number; format: string; hasAlpha: boolean } | null> {
    try {
      // This is a placeholder implementation
      // In production, you would use libraries like sharp, image-size, or exifr
      const ext = path.extname(filePath).toLowerCase();
      
      return {
        width: 1920, // Placeholder values
        height: 1080,
        format: ext.substring(1).toUpperCase(),
        hasAlpha: ext === '.png'
      };
    } catch (error) {
      console.error('Image metadata error:', error);
      return null;
    }
  }

  /**
   * Gets MIME type for file extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff'
    };
    
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Clears thumbnail cache
   */
  clearThumbnailCache(): void {
    this.thumbnailCache.clear();
  }
} 