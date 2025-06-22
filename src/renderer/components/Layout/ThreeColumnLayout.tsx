import React from 'react';

interface ThreeColumnLayoutProps {
  leftColumn: React.ReactNode;
  middleColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftColumn,
  middleColumn,
  rightColumn,
  className = '',
}) => {
  return (
    <div className={`three-column-layout ${className}`}>
      {/* Left Column - File Explorer */}
      <div className="column-base animate-slide-in-left">
        <div className="column-header">
          <h2 className="column-title">File Explorer</h2>
        </div>
        <div className="column-content">
          {leftColumn}
        </div>
      </div>

      {/* Middle Column - Image Preview */}
      <div className="column-base animate-fade-in">
        <div className="column-header">
          <h2 className="column-title">Image Preview</h2>
        </div>
        <div className="column-content">
          {middleColumn}
        </div>
      </div>

      {/* Right Column - Sub-Image Grid */}
      <div className="column-base animate-slide-in-right">
        <div className="column-header">
          <h2 className="column-title">Extracted Images</h2>
        </div>
        <div className="column-content">
          {rightColumn}
        </div>
      </div>
    </div>
  );
}; 