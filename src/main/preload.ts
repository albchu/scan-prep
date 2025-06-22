import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: any[]) => {
    // Whitelist channels that are allowed to be invoked
    const allowedChannels = [
      'file:read-directory',
      'file:validate-path',
      // Phase 3 channels
      'file:get-file-info',
      // Phase 4 channels
      'image:load',
      // Phase 5 channels
      'image:analyze-click',
    ];
    
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    } else {
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  }
}); 