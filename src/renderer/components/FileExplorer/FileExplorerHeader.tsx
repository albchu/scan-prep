import React from 'react';
import { PathInput } from './PathInput';
import { useApp } from '../../AppContext';

export const FileExplorerHeader: React.FC = () => {
  const {
    currentPath,
    handlePathChange,
    handlePathValidation,
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

      {/* Controls bar removed (view toggle) */}
    </div>
  );
}; 