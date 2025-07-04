import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]) => {
    // Whitelist channels that are allowed to be invoked
    const allowedChannels = [
      'file:read-directory',
      'file:validate-path',
      'file:get-file-info',
      'image:load',
      'image:generate-viewport-frame',
      'image:generate-viewport-preview',
    ];
    
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    } else {
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  }
}); 