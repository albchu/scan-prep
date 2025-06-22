import { ipcMain } from 'electron';
import { FileManager } from './services/FileManager';
import { ImageProcessor } from './services/ImageProcessor';
import { IPC_CHANNELS, DirectoryEntry, FileValidationResult, EnhancedFileInfo, ThumbnailOptions, IMAGE_IPC_CHANNELS, ImageLoadResult } from '@shared/types';

export class IPCHandlers {
  private fileManager: FileManager;
  private imageProcessor: ImageProcessor;

  constructor() {
    this.fileManager = new FileManager();
    this.imageProcessor = new ImageProcessor();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Handle directory reading requests
    ipcMain.handle(IPC_CHANNELS.FILE_READ_DIRECTORY, async (event, path: string): Promise<DirectoryEntry[]> => {
      try {
        console.log('Reading directory:', path);
        const entries = await this.fileManager.readDirectory(path);
        console.log(`Found ${entries.length} entries in directory`);
        return entries;
      } catch (error) {
        console.error('Error reading directory:', error);
        throw error;
      }
    });

    // Handle path validation requests
    ipcMain.handle(IPC_CHANNELS.FILE_VALIDATE_PATH, async (event, path: string): Promise<FileValidationResult> => {
      try {
        console.log('Validating path:', path);
        const result = await this.fileManager.validatePath(path);
        console.log('Path validation result:', result.isValid ? 'valid' : `invalid - ${result.error}`);
        return result;
      } catch (error) {
        console.error('Error validating path:', error);
        return {
          isValid: false,
          error: 'Failed to validate path'
        };
      }
    });

    // Phase 3: Handle enhanced file info requests
    ipcMain.handle(IPC_CHANNELS.FILE_GET_FILE_INFO, async (event, filePath: string): Promise<EnhancedFileInfo | null> => {
      try {
        console.log('Getting file info:', filePath);
        const fileInfo = await this.fileManager.getEnhancedFileInfo(filePath);
        console.log('File info result:', fileInfo ? 'success' : 'not found');
        return fileInfo;
      } catch (error) {
        console.error('Error getting file info:', error);
        return null;
      }
    });

    // Phase 3: Handle thumbnail generation requests
    ipcMain.handle(IPC_CHANNELS.FILE_GET_THUMBNAIL, async (event, filePath: string, options?: ThumbnailOptions): Promise<string | null> => {
      try {
        console.log('Generating thumbnail:', filePath);
        const thumbnail = await this.fileManager.generateThumbnail(filePath, options);
        console.log('Thumbnail generation result:', thumbnail ? 'success' : 'failed');
        return thumbnail;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
      }
    });

    // Phase 4: Handle image loading requests
    ipcMain.handle(IMAGE_IPC_CHANNELS.IMAGE_LOAD, async (event, imagePath: string): Promise<ImageLoadResult> => {
      try {
        console.log('Loading image:', imagePath);
        const result = await this.imageProcessor.loadImage(imagePath);
        console.log('Image load result:', result.success ? 'success' : `failed - ${result.error}`);
        return result;
      } catch (error) {
        console.error('Error loading image:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
  }

  /**
   * Clean up IPC handlers when shutting down
   */
  public removeHandlers(): void {
    ipcMain.removeHandler(IPC_CHANNELS.FILE_READ_DIRECTORY);
    ipcMain.removeHandler(IPC_CHANNELS.FILE_VALIDATE_PATH);
    // Phase 3: Remove new handlers
    ipcMain.removeHandler(IPC_CHANNELS.FILE_GET_FILE_INFO);
    ipcMain.removeHandler(IPC_CHANNELS.FILE_GET_THUMBNAIL);
    // Phase 4: Remove image handler
    ipcMain.removeHandler(IMAGE_IPC_CHANNELS.IMAGE_LOAD);
  }
} 