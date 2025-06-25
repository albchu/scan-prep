import React from 'react';
import { HierarchicalFileList } from './HierarchicalFileList';
import { FileExplorerHeader } from './FileExplorerHeader';
import { useApp } from '../../AppContext';
import { FileListError, FileListNoDir } from './FileListStates';

export const FileExplorer: React.FC = () => {
  const {
    currentPath,
    selectedFile,
    directoryEntries,
    errorMessage,
    handleFileSelect,
  } = useApp();

  const renderFileListContent = () => {
    if (errorMessage) {
      return <FileListError message={errorMessage} />;
    }

    if (!currentPath) {
      return <FileListNoDir />;
    }

    // hierarchical list view (only mode)
    return (
      <div className="h-full w-full overflow-y-auto p-2">
        <HierarchicalFileList
          rootEntries={directoryEntries}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-dark-900">
      <FileExplorerHeader />

      {/* Main content area */}
      <div className="flex-1 min-h-0">
        {renderFileListContent()}
      </div>

      {/* Footer with selection info and view stats */}
      {selectedFile && (
        <div className="flex-shrink-0 px-4 py-2 bg-dark-800 border-t border-dark-700">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-400 truncate flex-1">
              Selected: <span className="text-dark-200">{selectedFile}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 