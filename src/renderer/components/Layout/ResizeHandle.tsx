import React from 'react';

interface ResizeHandleProps {
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
  isActive, 
  onMouseDown 
}) => {
  return (
    <div
      className={`resize-handle ${isActive ? 'resize-handle-active' : ''}`}
      onMouseDown={onMouseDown}
    />
  );
}; 