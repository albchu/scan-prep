import React, { useState, useCallback } from 'react';
import { PathInput } from './PathInput';
import { EnhancedFileList } from './EnhancedFileList';
import { ViewToggle } from './ViewToggle';
import { DirectoryTree } from './DirectoryTree';
import { DirectoryEntry, IPC_CHANNELS, ViewMode, APP_CONSTANTS } from '@shared/types';

// Type declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

interface FileExplorerProps {
  onFileSelect?: (filePath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Phase 3: New state for advanced features
  const [viewMode, setViewMode] = useState<ViewMode>(APP_CONSTANTS.VIEW_MODES.LIST);
  const [showDirectoryTree, setShowDirectoryTree] = useState(true);

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

  // Phase 3: Handle view mode changes
  const handleViewModeChange = useCallback((newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    console.log('View mode changed to:', newViewMode);
  }, []);

  // Phase 3: Handle directory tree navigation
  const handleTreePathSelect = useCallback((path: string) => {
    console.log('Directory tree path selected:', path);
    handlePathChange(path);
  }, [handlePathChange]);

  // Phase 3: Toggle directory tree visibility
  const toggleDirectoryTree = useCallback(() => {
    setShowDirectoryTree(prev => !prev);
  }, []);

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {/* Header with path input and controls */}
      <div className="flex-shrink-0 p-4 border-b border-dark-700 space-y-3">
        {/* Path input */}
        <div>
        <PathInput
          currentPath={currentPath}
          onPathChange={handlePathChange}
          onPathValidation={handlePathValidation}
        />
      </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between">
          {/* Directory tree toggle */}
          <button
            onClick={toggleDirectoryTree}
            className="flex items-center px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-md transition-colors duration-150"
            title={showDirectoryTree ? 'Hide directory tree' : 'Show directory tree'}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Tree
          </button>

          {/* View toggle */}
          <ViewToggle
            currentView={viewMode}
            onViewChange={handleViewModeChange}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Directory tree panel */}
        {showDirectoryTree && currentPath && (
          <div className="w-64 border-r border-dark-700 bg-dark-850">
            <div className="p-3 border-b border-dark-700">
              <h3 className="text-sm font-medium text-dark-200">Directories</h3>
            </div>
            <DirectoryTree
              rootPath={currentPath}
              currentPath={currentPath}
              onPathSelect={handleTreePathSelect}
              className="flex-1"
            />
          </div>
        )}

        {/* File list area */}
      <div className="flex-1 overflow-hidden">
        {errorMessage ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 text-red-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-red-400 font-medium">Directory Error</p>
              <p className="text-dark-400 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        ) : currentPath ? (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
                <EnhancedFileList
                entries={directoryEntries}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                  viewMode={viewMode}
                isLoading={isLoadingDirectory}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-dark-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark-300 mb-2">
                No Directory Selected
              </h3>
              <p className="text-dark-500 text-sm max-w-sm">
                Enter a directory path above to browse and select image files for processing.
              </p>
                <p className="text-dark-600 text-xs mt-2">
                  Use the view toggle to switch between list and thumbnail modes.
                </p>
              </div>
            </div>
          )}
          </div>
      </div>

      {/* Footer with selection info and view stats */}
      {selectedFile && (
        <div className="flex-shrink-0 px-4 py-2 bg-dark-800 border-t border-dark-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-400 truncate flex-1">
            Selected: <span className="text-dark-200">{selectedFile}</span>
          </p>
            
            {/* View mode indicator */}
            <div className="ml-4 text-xs text-dark-500">
              {viewMode === 'thumbnail' ? '🔲' : '📄'} {viewMode}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 