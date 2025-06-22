import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ThreeColumnLayoutProps {
  leftColumn: React.ReactNode;
  middleColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
  // Minimum widths for each column
  minLeftWidth?: number;
  minMiddleWidth?: number;
  minRightWidth?: number;
  // Initial widths (percentages)
  initialLeftWidth?: number;
  initialMiddleWidth?: number;
  initialRightWidth?: number;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  leftColumn,
  middleColumn,
  rightColumn,
  className = '',
  minLeftWidth = 200,
  minMiddleWidth = 300,
  minRightWidth = 250,
  initialLeftWidth = 20,
  initialMiddleWidth = 50,
  initialRightWidth = 30,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [middleWidth, setMiddleWidth] = useState(initialMiddleWidth);
  const [rightWidth, setRightWidth] = useState(initialRightWidth);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
  // Store initial values when drag starts
  const dragStartRef = useRef({
    mouseX: 0,
    leftWidth: 0,
    middleWidth: 0,
    rightWidth: 0,
  });

  // Ensure widths always sum to 100%
  useEffect(() => {
    const total = leftWidth + middleWidth + rightWidth;
    if (Math.abs(total - 100) > 0.1) {
      const scale = 100 / total;
      setLeftWidth(leftWidth * scale);
      setMiddleWidth(middleWidth * scale);
      setRightWidth(rightWidth * scale);
    }
  }, []);

  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    
    // Store initial state
    dragStartRef.current = {
      mouseX: ((e.clientX - containerLeft) / containerWidth) * 100,
      leftWidth,
      middleWidth,
      rightWidth,
    };
    
    setIsDraggingLeft(true);
  }, [leftWidth, middleWidth, rightWidth]);

  const handleRightResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    
    // Store initial state
    dragStartRef.current = {
      mouseX: ((e.clientX - containerLeft) / containerWidth) * 100,
      leftWidth,
      middleWidth,
      rightWidth,
    };
    
    setIsDraggingRight(true);
  }, [leftWidth, middleWidth, rightWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerLeft = containerRef.current.getBoundingClientRect().left;
    const mouseX = e.clientX - containerLeft;
    const mousePercent = (mouseX / containerWidth) * 100;
    
    const deltaPercent = mousePercent - dragStartRef.current.mouseX;

    if (isDraggingLeft) {
      // Calculate new widths based on delta from initial position
      const newLeftWidth = dragStartRef.current.leftWidth + deltaPercent;
      const newMiddleWidth = dragStartRef.current.middleWidth - deltaPercent;
      
      // Check minimum widths
      const minLeftPercent = (minLeftWidth / containerWidth) * 100;
      const minMiddlePercent = (minMiddleWidth / containerWidth) * 100;
      
      if (newLeftWidth >= minLeftPercent && newMiddleWidth >= minMiddlePercent) {
        setLeftWidth(newLeftWidth);
        setMiddleWidth(newMiddleWidth);
      }
    } else if (isDraggingRight) {
      // Calculate new widths based on delta from initial position
      const newMiddleWidth = dragStartRef.current.middleWidth + deltaPercent;
      const newRightWidth = dragStartRef.current.rightWidth - deltaPercent;
      
      // Check minimum widths
      const minMiddlePercent = (minMiddleWidth / containerWidth) * 100;
      const minRightPercent = (minRightWidth / containerWidth) * 100;
      
      if (newMiddleWidth >= minMiddlePercent && newRightWidth >= minRightPercent) {
        setMiddleWidth(newMiddleWidth);
        setRightWidth(newRightWidth);
      }
    }
  }, [isDraggingLeft, isDraggingRight, minLeftWidth, minMiddleWidth, minRightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className={`flex h-full relative ${className}`}
      style={{ overflow: 'hidden' }}
    >
      {/* Left Column - File Explorer */}
      <div 
        className="column-base animate-slide-in-left"
        style={{ width: `${leftWidth}%`, minWidth: `${minLeftWidth}px` }}
      >
        <div className="column-header">
          <h2 className="column-title">File Explorer</h2>
        </div>
        <div className="column-content">
          {leftColumn}
        </div>
      </div>

      {/* Left Resize Handle */}
      <div
        className={`resize-handle ${isDraggingLeft ? 'resize-handle-active' : ''}`}
        onMouseDown={handleLeftResizeStart}
      />

      {/* Middle Column - Image Preview */}
      <div 
        className="column-base animate-fade-in"
        style={{ width: `${middleWidth}%`, minWidth: `${minMiddleWidth}px` }}
      >
        <div className="column-header">
          <h2 className="column-title">Image Preview</h2>
        </div>
        <div className="column-content">
          {middleColumn}
        </div>
      </div>

      {/* Right Resize Handle */}
      <div
        className={`resize-handle ${isDraggingRight ? 'resize-handle-active' : ''}`}
        onMouseDown={handleRightResizeStart}
      />

      {/* Right Column - Sub-Image Grid */}
      <div 
        className="column-base animate-slide-in-right"
        style={{ width: `${rightWidth}%`, minWidth: `${minRightWidth}px` }}
      >
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