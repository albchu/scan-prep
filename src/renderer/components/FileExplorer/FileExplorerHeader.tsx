import React from 'react';
import { PathInput } from './PathInput';
import { ViewToggle } from './ViewToggle';
import { useApp } from '../../AppContext';

export const FileExplorerHeader: React.FC = () => {
  const {
    currentPath,
    viewMode,
    handlePathChange,
    handlePathValidation,
    handleViewModeChange,
  } = useApp();

  return (
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
      <div className="flex items-center justify-end">
        <ViewToggle
          currentView={viewMode}
          onViewChange={handleViewModeChange}
        />
      </div>
    </div>
  );
}; 