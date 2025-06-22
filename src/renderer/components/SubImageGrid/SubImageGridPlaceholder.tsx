import React from 'react';

// Grid icon SVG component
const GridIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

export const SubImageGridPlaceholder: React.FC = () => {
  return (
    <div className="empty-state">
      <GridIcon className="empty-state-icon" />
      <h3 className="empty-state-title">No Extracted Images</h3>
      <p className="empty-state-description">
        After analyzing an image, extracted sub-images will appear here as a grid. You&apos;ll be able to save individual images or export all at once.
      </p>
      <div className="mt-6 space-y-3">
        <button className="btn-secondary w-full" disabled>
          Save All (Coming in Phase 10)
        </button>
        <div className="text-xs text-dark-500 text-center">
          Extracted images will maintain original quality
        </div>
      </div>
    </div>
  );
}; 