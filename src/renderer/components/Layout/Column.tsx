import React from 'react';

interface ColumnProps {
  title: string;
  width: number;
  minWidth: number;
  animation?: string;
  children: React.ReactNode;
}

export const Column: React.FC<ColumnProps> = ({
  title,
  width,
  minWidth,
  animation = '',
  children,
}) => {
  return (
    <div 
      className={`column-base ${animation}`}
      style={{ width: `${width}%`, minWidth: `${minWidth}px` }}
    >
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
      </div>
      <div className="column-content">
        {children}
      </div>
    </div>
  );
}; 