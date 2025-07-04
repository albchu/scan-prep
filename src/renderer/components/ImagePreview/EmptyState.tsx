import React from 'react';

// Image icon SVG component
const ImageIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export const EmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <ImageIcon className="empty-state-icon" />
      <h3 className="empty-state-title">No Image Selected</h3>
      <p className="empty-state-description">
        Select an image from the file explorer to preview it here
      </p>
      <div className="mt-6 space-y-2">
        <div className="text-xs text-dark-400 text-center">
          Supported formats: JPEG, PNG, TIFF
        </div>
      </div>
    </div>
  );
}; 