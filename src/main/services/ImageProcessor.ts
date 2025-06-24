import { promises as fs } from 'fs';
import * as path from 'path';
import { ImageLoadResult } from '@shared/types';
import { APP_CONSTANTS } from '@shared/constants';

export class ImageProcessor {
  /**
   * Load an image file and return its data as base64 with metadata
   */
  async loadImage(imagePath: string): Promise<ImageLoadResult> {
    try {
      // Validate file exists
      const stats = await fs.stat(imagePath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: 'Path is not a file',
        };
      }

      // Check if file extension is supported
      const ext = path.extname(imagePath).toLowerCase();
      const isSupported = APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS.includes(
        ext as typeof APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS[number]
      );
      
      if (!isSupported) {
        return {
          success: false,
          error: `Unsupported image format: ${ext}`,
        };
      }

      // Read file as base64
      const buffer = await fs.readFile(imagePath);
      const base64 = buffer.toString('base64');
      const mimeType = this.getMimeType(ext);

      // Get basic image dimensions using a simple approach
      // For now, we'll return placeholder dimensions
      // In a real implementation, we'd use a library like sharp or jimp
      const dimensions = await this.getImageDimensions(buffer, ext);

      return {
        success: true,
        data: {
          base64: `data:${mimeType};base64,${base64}`,
          width: dimensions.width,
          height: dimensions.height,
          format: ext.substring(1).toUpperCase(),
          size: buffer.length,
        },
      };
    } catch (error) {
      console.error('Error loading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error loading image',
      };
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Get image dimensions from buffer
   * This is a simplified implementation - in production, use a proper image library
   */
  private async getImageDimensions(
    buffer: Buffer,
    ext: string
  ): Promise<{ width: number; height: number }> {
    // For PNG files, we can read dimensions from the header
    if (ext === '.png') {
      try {
        // PNG dimensions are at bytes 16-23
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      } catch {
        // Fallback to defaults
      }
    }

    // For JPEG files, it's more complex - would need proper parsing
    // For now, return reasonable defaults that will be replaced
    // when we integrate a proper image processing library
    return { width: 800, height: 600 };
  }
} 