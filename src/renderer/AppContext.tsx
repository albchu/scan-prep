import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DirectoryEntry, ViewMode, IPC_CHANNELS, APP_CONSTANTS } from '@shared/types';

interface AppContextType {
  // Directory and file state
  currentPath: string;
  selectedFile: string | null;
  directoryEntries: DirectoryEntry[];
  isLoadingDirectory: boolean;
  errorMessage: string | null;
  
  // View state
  viewMode: ViewMode;
  
  // Actions
  setCurrentPath: (path: string) => void;
  handlePathChange: (newPath: string) => Promise<void>;
  handlePathValidation: (isValid: boolean, error?: string) => void;
  handleFileSelect: (filePath: string) => void;
  handleViewModeChange: (newViewMode: ViewMode) => void;
  handleTreePathSelect: (path: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
  onFileSelect?: (filePath: string) => void;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, onFileSelect }) => {
  // Directory and file state
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(APP_CONSTANTS.VIEW_MODES.LIST);

  const handlePathChange = useCallback(async (newPath: string) => {
    setCurrentPath(newPath);
    setSelectedFile(null);
    setErrorMessage(null);
    setIsLoadingDirectory(true);

    try {
      console.log('Loading directory:', newPath);
      const entries = await window.electronAPI.invoke(IPC_CHANNELS.FILE_READ_DIRECTORY, newPath);
      setDirectoryEntries(entries);
      console.log(`Loaded ${entries.length} entries`);
    } catch (error) {
      console.error('Failed to load directory:', error);
      setErrorMessage(`Failed to load directory: ${error}`);
      setDirectoryEntries([]);
    } finally {
      setIsLoadingDirectory(false);
    }
  }, []);

  const handlePathValidation = useCallback((isValid: boolean, error?: string) => {
    if (!isValid) {
      setErrorMessage(error || 'Invalid directory path');
      setDirectoryEntries([]);
    } else {
      setErrorMessage(null);
    }
  }, []);

  const handleFileSelect = useCallback((filePath: string) => {
    setSelectedFile(filePath);
    
    // Notify parent component if callback is provided
    if (onFileSelect) {
      onFileSelect(filePath);
    }
    
    console.log('File selected:', filePath);
  }, [onFileSelect]);

  const handleViewModeChange = useCallback((newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    console.log('View mode changed to:', newViewMode);
  }, []);

  const handleTreePathSelect = useCallback((path: string) => {
    console.log('Directory tree path selected:', path);
    handlePathChange(path);
  }, [handlePathChange]);

  const value = {
    // Directory and file state
    currentPath,
    selectedFile,
    directoryEntries,
    isLoadingDirectory,
    errorMessage,
    
    // View state
    viewMode,
    
    // Actions
    setCurrentPath,
    handlePathChange,
    handlePathValidation,
    handleFileSelect,
    handleViewModeChange,
    handleTreePathSelect,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 