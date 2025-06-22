import React from 'react';

// Folder icon SVG component
const FolderIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
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
);

export const FileExplorerPlaceholder: React.FC = () => {
  return (
    <div className="empty-state">
      <FolderIcon className="empty-state-icon" />
      <h3 className="empty-state-title">No Directory Selected</h3>
      <p className="empty-state-description">
        Use the File menu to open a directory containing scanned images, or this area will allow you to browse and select image files in future phases.
      </p>
      <div className="mt-6">
        <button className="btn-primary" disabled>
          Browse Files (Coming in Phase 2)
        </button>
      </div>
    </div>
  );
}; 