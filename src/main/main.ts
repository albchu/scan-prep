import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { IPCHandlers } from './ipc-handlers';

class Application {
  private windowManager: WindowManager;
  private ipcHandlers: IPCHandlers;
  private isQuitting = false;

  constructor() {
    this.windowManager = new WindowManager();
    this.ipcHandlers = new IPCHandlers();
    this.setupEventHandlers();
    this.setupProcessSignalHandlers();
  }

  private setupEventHandlers(): void {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.whenReady().then(() => {
      this.createMainWindow();

      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // Quit when all windows are closed on all platforms
    // This ensures the terminal process is killed when windows are closed
    app.on('window-all-closed', () => {
      this.quit();
    });

    // Handle app activation (macOS)
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (this.windowManager.getMainWindow() === null) {
        this.createMainWindow();
      }
    });

    // Handle app quit attempts
    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    // Security: Prevent new window creation using modern Electron API
    app.on('web-contents-created', (event, contents) => {
      // Use setWindowOpenHandler instead of deprecated 'new-window' event
      contents.setWindowOpenHandler(({ url: _url }) => {
        // Prevent opening new windows - all external links should open in default browser
        return { action: 'deny' };
      });
    });

    // Handle certificate errors (for security)
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      // In production, you should implement proper certificate validation
      event.preventDefault();
      callback(false);
    });

    // Prevent navigation to external URLs in the main window
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (navigationEvent, navigationURL) => {
        const parsedUrl = new URL(navigationURL);
        
        // Allow navigation to local files
        if (parsedUrl.protocol !== 'file:') {
          navigationEvent.preventDefault();
        }
      });
    });
  }

  private setupProcessSignalHandlers(): void {
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT (Ctrl+C). Shutting down gracefully...');
      this.quit();
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM. Shutting down gracefully...');
      this.quit();
    });

    // Handle Windows Ctrl+C
    if (process.platform === 'win32') {
      process.on('SIGBREAK', () => {
        console.log('\nReceived SIGBREAK. Shutting down gracefully...');
        this.quit();
      });
    }
  }

  private quit(): void {
    if (this.isQuitting) {
      return;
    }
    
    this.isQuitting = true;
    console.log('Shutting down Scan Prep application...');
    
    // Close all windows
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });

    // Quit the app
    app.quit();
    
    // Force exit after a timeout to ensure we don't hang
    setTimeout(() => {
      console.log('Force exiting application...');
      process.exit(0);
    }, 1000);
  }

  private createMainWindow(): void {
    try {
      const mainWindow = this.windowManager.createMainWindow();
      
      // Handle window close event
      mainWindow.on('close', (_event) => {
        // Always quit the app when window is closed, regardless of platform
        // This ensures the terminal process is killed when the window is closed
        this.quit();
      });
      
    } catch (error) {
      console.error('Failed to create main window:', error);
      this.quit();
    }
  }

  public async initialize(): Promise<void> {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.scanprep.app');
    }

    // Disable GPU acceleration if needed for better compatibility
    if (process.env.DISABLE_GPU === 'true') {
      app.disableHardwareAcceleration();
    }

    // Set application name
    app.setName('Scan Prep');

    // Enable live region change notifications on Linux
    if (process.platform === 'linux') {
      process.env.ELECTRON_OZONE_PLATFORM_HINT = 'auto';
    }

    console.log('Scan Prep application initialized');
  }
}

// Create and initialize the application
const application = new Application();

// Initialize the application
application.initialize().catch((error) => {
  console.error('Failed to initialize application:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 