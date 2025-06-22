import React, { useRef, useEffect, useState } from 'react';
import { ImageLoadResult } from '@shared/types';

interface ImageDisplayProps {
  imageData: ImageLoadResult['data'];
  fileName: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageData, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  useEffect(() => {
    if (imageData && containerSize.width > 0 && containerSize.height > 0) {
      // Calculate scale to fit image within container
      const padding = 40; // pixels of padding
      const maxWidth = containerSize.width - padding;
      const maxHeight = containerSize.height - padding - 120; // Account for bottom info section

      const widthScale = maxWidth / imageData.width;
      const heightScale = maxHeight / imageData.height;
      const newScale = Math.min(widthScale, heightScale, 1); // Don't scale up

      setScale(newScale);
    }
  }, [imageData, containerSize]);

  if (!imageData) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Image container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          className="relative bg-dark-800 rounded-lg shadow-2xl"
          style={{
            width: imageData.width * scale,
            height: imageData.height * scale,
          }}
        >
          <img
            src={imageData.base64}
            alt={fileName}
            className="w-full h-full rounded-lg"
            style={{
              imageRendering: scale < 0.5 ? 'pixelated' : 'auto',
            }}
          />
        </div>
      </div>

      {/* Bottom section with file info and action button */}
      <div className="p-4 border-t border-dark-700 space-y-3">
        {/* File info */}
        <div>
          <h3 className="text-lg font-medium text-dark-100 truncate">{fileName}</h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
            <span>{imageData.width} × {imageData.height}px</span>
            <span>{imageData.format}</span>
            <span>{formatFileSize(imageData.size)}</span>
            {scale < 1 && (
              <span className="text-yellow-500">
                {Math.round(scale * 100)}% zoom
              </span>
            )}
          </div>
        </div>
        
        {/* Action button */}
        <button className="btn-primary w-full text-center" disabled>
          Analyze Image (Coming in Phase 5)
        </button>
      </div>
    </div>
  );
}; 