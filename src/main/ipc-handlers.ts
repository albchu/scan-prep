import { ipcMain } from 'electron';
import { FileManager } from './services/FileManager';
import { ImageProcessor } from './services/ImageProcessor';
import { ImageAnalysisService } from './services/ImageAnalysisService';
import { IPC_CHANNELS, DirectoryEntry, FileValidationResult, EnhancedFileInfo, IMAGE_IPC_CHANNELS, ImageLoadResult, ANALYSIS_IPC_CHANNELS, AnalysisResult, AnalysisOptions } from '@shared/types';

export class IPCHandlers {
  private fileManager: FileManager;
  private imageProcessor: ImageProcessor;
  private imageAnalysisService: ImageAnalysisService;

  constructor() {
    this.fileManager = new FileManager();
    this.imageProcessor = new ImageProcessor();
    this.imageAnalysisService = new ImageAnalysisService();
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



    // Phase 5: Handle click-based image analysis requests
    ipcMain.handle(ANALYSIS_IPC_CHANNELS.IMAGE_ANALYZE_CLICK, async (event, imagePath: string, clickX: number, clickY: number, options?: Partial<AnalysisOptions>): Promise<AnalysisResult> => {
      try {
        console.log('Analyzing image with click:', imagePath, 'at coordinates:', { clickX, clickY }, 'with options:', options);
        const result = await this.imageAnalysisService.analyzeImageWithClick(imagePath, clickX, clickY, options);
        console.log(`Click analysis result: ${result.success ? 'success' : 'failed'}, found ${result.detectedImages.length} sub-images`);
        return result;
      } catch (error) {
        console.error('Error analyzing image with click:', error);
        return {
          success: false,
          detectedImages: [],
          analysisTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          imageWidth: 0,
          imageHeight: 0,
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
    // Phase 4: Remove image handler
    ipcMain.removeHandler(IMAGE_IPC_CHANNELS.IMAGE_LOAD);
    // Phase 5: Remove analysis handlers
    ipcMain.removeHandler(ANALYSIS_IPC_CHANNELS.IMAGE_ANALYZE_CLICK);
  }
} 