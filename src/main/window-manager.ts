import { BrowserWindow, Menu, shell, app } from 'electron';
import * as path from 'path';
import { WindowOptions, APP_CONSTANTS } from '@shared/types';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  public createMainWindow(options?: Partial<WindowOptions>): BrowserWindow {
    const windowOptions: WindowOptions = {
      width: APP_CONSTANTS.DEFAULT_WINDOW_WIDTH,
      height: APP_CONSTANTS.DEFAULT_WINDOW_HEIGHT,
      minWidth: APP_CONSTANTS.MIN_WINDOW_WIDTH,
      minHeight: APP_CONSTANTS.MIN_WINDOW_HEIGHT,
      show: false,
      title: 'Scan Prep - Image Splitting Tool',
      ...options,
    };

    this.mainWindow = new BrowserWindow({
      ...windowOptions,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'), // Will be created in later phases
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      backgroundColor: '#0f172a', // Dark theme background
      icon: process.platform === 'linux' ? path.join(__dirname, '../../assets/icon.png') : undefined,
    });

    // Load the React application
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        
        // Focus the window on creation
        if (isDev) {
          this.mainWindow.webContents.openDevTools();
        }
      }
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Set up application menu
    this.setupApplicationMenu();

    return this.mainWindow;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public closeMainWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }

  private setupApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Directory...',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              // Will be implemented in Phase 2
              console.log('Open Directory clicked');
            },
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.reload();
              }
            },
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.toggleDevTools();
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.webContents.setZoomLevel(0);
              }
            },
          },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => {
              if (this.mainWindow) {
                const currentZoom = this.mainWindow.webContents.getZoomLevel();
                this.mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
              }
            },
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => {
              if (this.mainWindow) {
                const currentZoom = this.mainWindow.webContents.getZoomLevel();
                this.mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
              }
            },
          },
        ],
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            click: () => {
              if (this.mainWindow) {
                this.mainWindow.minimize();
              }
            },
          },
                    {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            click: () => {
              // Always quit the app when closing window to ensure terminal process is killed
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About Scan Prep',
            click: () => {
              // Will be implemented in later phases
              console.log('About clicked');
            },
          },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: 'Scan Prep',
        submenu: [
          {
            label: 'About Scan Prep',
            role: 'about',
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
          },
          { type: 'separator' },
          {
            label: 'Hide Scan Prep',
            accelerator: 'Command+H',
            role: 'hide',
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            role: 'hideOthers',
          },
          {
            label: 'Show All',
            role: 'unhide',
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      });

      // Update File menu for macOS
      template[1].submenu = [
        {
          label: 'Open Directory...',
          accelerator: 'Cmd+O',
          click: () => {
            console.log('Open Directory clicked');
          },
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'Cmd+W',
          click: () => {
            // Quit the app to ensure terminal process is killed
            app.quit();
          },
        },
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
} 