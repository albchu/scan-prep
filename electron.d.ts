// Electron type declarations

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DISABLE_GPU?: string;
    ELECTRON_OZONE_PLATFORM_HINT?: string;
  }
}

// Hot module replacement types for development
declare var module: {
  hot?: {
    accept(path?: string, callback?: () => void): void;
  };
};

// Window interface extensions for IPC communication
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      // Add other IPC methods as needed in future phases
    };
  }
} 