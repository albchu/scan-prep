import { ipcMain } from "electron";
import { FileManager } from "./services/FileManager";
import { ImageProcessor } from "./services/ImageProcessor";
import { ImageAnalysisService } from "./services/ImageAnalysisService";
import {
  DirectoryEntry,
  FileValidationResult,
  EnhancedFileInfo,
  ImageLoadResult,
  AnalysisOptions,
  ViewportFrameResult,
  ViewportFrame,
} from "@shared/types";
import { IPC_CHANNELS } from "@shared/constants";

export class IPCHandlers {
  private fileManager: FileManager;
  private imageProcessor: ImageProcessor;
  private imageAnalysisService: ImageAnalysisService;

  constructor() {
    this.fileManager = new FileManager();
    // Refactor note: These classes are not used well. Might as well be immutable constants from a util file.
    this.imageProcessor = new ImageProcessor();
    this.imageAnalysisService = new ImageAnalysisService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    console.log("Registering IPC handlers...");

    // Handle directory reading requests
    ipcMain.handle(
      IPC_CHANNELS.FILE_READ_DIRECTORY,
      async (event, path: string): Promise<DirectoryEntry[]> => {
        try {
          console.log("Reading directory:", path);
          const entries = await this.fileManager.readDirectory(path);
          console.log(`Found ${entries.length} entries in directory`);
          return entries;
        } catch (error) {
          console.error("Error reading directory:", error);
          throw error;
        }
      }
    );

    // Handle path validation requests
    ipcMain.handle(
      IPC_CHANNELS.FILE_VALIDATE_PATH,
      async (event, path: string): Promise<FileValidationResult> => {
        try {
          console.log("Validating path:", path);
          const result = await this.fileManager.validatePath(path);
          console.log(
            "Path validation result:",
            result.isValid ? "valid" : `invalid - ${result.error}`
          );
          return result;
        } catch (error) {
          console.error("Error validating path:", error);
          return {
            isValid: false,
            error: "Failed to validate path",
          };
        }
      }
    );

    // Handle enhanced file info requests
    ipcMain.handle(
      IPC_CHANNELS.FILE_GET_FILE_INFO,
      async (event, filePath: string): Promise<EnhancedFileInfo | null> => {
        try {
          console.log("Getting file info:", filePath);
          const fileInfo = await this.fileManager.getEnhancedFileInfo(filePath);
          console.log("File info result:", fileInfo ? "success" : "not found");
          return fileInfo;
        } catch (error) {
          console.error("Error getting file info:", error);
          return null;
        }
      }
    );

    // Handle image loading requests
    ipcMain.handle(
      IPC_CHANNELS.IMAGE_LOAD,
      async (event, imagePath: string): Promise<ImageLoadResult> => {
        try {
          console.log("Loading image:", imagePath);
          const result = await this.imageProcessor.loadImage(imagePath);
          console.log(
            "Image load result:",
            result.success ? "success" : `failed - ${result.error}`
          );
          return result;
        } catch (error) {
          console.error("Error loading image:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    );

    // Handle click-based image analysis requests
    ipcMain.handle(
      IPC_CHANNELS.GENERATE_VIEWPORT_FRAME,
      async (
        event,
        imagePath: string,
        clickX: number,
        clickY: number,
        options?: Partial<AnalysisOptions>
      ): Promise<ViewportFrameResult> => {
        const startTime = Date.now();
        try {
          console.log(
            "Analyzing image with click:",
            imagePath,
            "at coordinates:",
            { clickX, clickY },
            "with options:",
            options
          );
          
          // Refactor note: This result can only ever return a max of 1 viewport frame. Revise naming this functionality to be clearer.
          const result = await this.imageAnalysisService.analyzeImageWithClick(
            imagePath,
            clickX,
            clickY,
            options
          );
          return {
            ...result,
            analysisTime: Date.now() - startTime,
          };
        } catch (error) {
          console.error("Error analyzing image with click:", error);
          return {
            success: false,
            analysisTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    );

    // Handle viewport preview generation
    console.log('Registering viewport preview handler for channel:', IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW);
    ipcMain.handle(IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW, async (event, imagePath: string, viewportFrame: ViewportFrame, previewSize: { width: number; height: number }): Promise<ViewportFrameResult> => {
      try {
        console.log('Generating viewport preview for:', imagePath, 'viewport frame:', viewportFrame.id, 'size:', previewSize);
        const result = await this.imageAnalysisService.generateViewportPreview(imagePath, viewportFrame);
        console.log(`Viewport preview result: ${result.success ? 'success' : 'failed'}`);
        return result;
      } catch (error) {
        console.error('Error generating viewport preview:', error);
        return {
          success: false,
          viewportFrame,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    console.log("All IPC handlers registered successfully");
  }

  /**
   * Clean up IPC handlers when shutting down
   */
  public removeHandlers(): void {
    ipcMain.removeHandler(IPC_CHANNELS.FILE_READ_DIRECTORY);
    ipcMain.removeHandler(IPC_CHANNELS.FILE_VALIDATE_PATH);
    ipcMain.removeHandler(IPC_CHANNELS.FILE_GET_FILE_INFO);
    ipcMain.removeHandler(IPC_CHANNELS.IMAGE_LOAD);
    ipcMain.removeHandler(IPC_CHANNELS.GENERATE_VIEWPORT_FRAME);
    // ipcMain.removeHandler(IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW);
  }
}
