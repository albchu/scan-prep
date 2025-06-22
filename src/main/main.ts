import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { IPCHandlers } from './ipc-handlers';

class Application {
  private windowManager: WindowManager;
  private ipcHandlers: IPCHandlers;

  constructor() {
    this.windowManager = new WindowManager();
    this.ipcHandlers = new IPCHandlers();
    this.setupEventHandlers();
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

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle app activation (macOS)
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (this.windowManager.getMainWindow() === null) {
        this.createMainWindow();
      }
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

  private createMainWindow(): void {
    try {
      this.windowManager.createMainWindow();
    } catch (error) {
      console.error('Failed to create main window:', error);
      app.quit();
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
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  app.quit();
}); 