import React from 'react';
import { ViewMode } from '@shared/types';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ListIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
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
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

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
      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
    />
  </svg>
);

export const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  const toggleButtons = [
    {
      value: 'list' as ViewMode,
      icon: ListIcon,
      label: 'List View',
      tooltip: 'Show files in list format with detailed information'
    },
    {
      value: 'thumbnail' as ViewMode,
      icon: GridIcon,
      label: 'Thumbnail View',
      tooltip: 'Show files as thumbnails in a grid layout'
    }
  ];

  return (
    <div className="flex items-center space-x-1 bg-dark-800 rounded-lg p-1">
      {toggleButtons.map(({ value, icon: Icon, label, tooltip }) => {
        const isActive = currentView === value;
        
        return (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={`
              flex items-center justify-center p-2 rounded-md text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-dark-300 hover:text-dark-100 hover:bg-dark-700'
              }
            `}
            title={tooltip}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">{label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}; 