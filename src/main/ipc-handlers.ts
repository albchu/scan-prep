import { ipcMain } from 'electron';
import { FileManager } from './services/FileManager';
import { IPC_CHANNELS, DirectoryEntry, FileValidationResult } from '@shared/types';

export class IPCHandlers {
  private fileManager: FileManager;

  constructor() {
    this.fileManager = new FileManager();
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
  }

  /**
   * Clean up IPC handlers when shutting down
   */
  public removeHandlers(): void {
    ipcMain.removeHandler(IPC_CHANNELS.FILE_READ_DIRECTORY);
    ipcMain.removeHandler(IPC_CHANNELS.FILE_VALIDATE_PATH);
  }
} 