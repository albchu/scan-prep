import React from 'react';
import { EnhancedFileList } from './EnhancedFileList';
import { DirectoryTree } from './DirectoryTree';
import { FileExplorerHeader } from './FileExplorerHeader';
import { useApp } from '../../AppContext';
import { FileListError, FileListNoDir } from './FileListStates';

// Type declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

export const FileExplorer: React.FC = () => {
  const {
    currentPath,
    selectedFile,
    directoryEntries,
    isLoadingDirectory,
    errorMessage,
    viewMode,
    handleFileSelect,
  } = useApp();

  const renderFileListContent = () => {
    if (errorMessage) {
      return <FileListError message={errorMessage} />;
    }

    if (!currentPath) {
      return <FileListNoDir />;
    }

    return (
      <div className="h-full w-full overflow-y-auto">
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
    );
  };

  return (
    <div className="h-full flex flex-col bg-dark-900">
      <FileExplorerHeader />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Directory tree panel - Always visible */}
        <div className="w-64 flex-shrink-0 border-r border-dark-700 bg-dark-850 overflow-y-auto">
          <div className="p-3 border-b border-dark-700">
            <h3 className="text-sm font-medium text-dark-200">Directories</h3>
          </div>
          {currentPath && (
            <DirectoryTree
              rootPath={currentPath}
              currentPath={currentPath}
              className="flex-1"
            />
          )}
        </div>

        {/* File list area */}
        <div className="flex-1 min-w-0">
          {renderFileListContent()}
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