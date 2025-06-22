import React, { useRef, useEffect, useState } from 'react';
import { ImageLoadResult } from '@shared/types';

interface ImageDisplayProps {
  imageData: ImageLoadResult['data'];
  fileName: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageData, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState<number | null>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && imageContainerRef.current && imageData) {
        const container = imageContainerRef.current.getBoundingClientRect();
        const padding = 40;
        const maxWidth = container.width - padding;
        const maxHeight = container.height - padding;

        // Calculate how much the image is scaled to fit
        const widthScale = maxWidth / imageData.width;
        const heightScale = maxHeight / imageData.height;
        const actualScale = Math.min(widthScale, heightScale, 1);

        // Only show scale if image is being scaled down
        setDisplayScale(actualScale < 1 ? actualScale : null);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageData]);

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
      <div ref={imageContainerRef} className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <img
          src={imageData.base64}
          alt={fileName}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-dark-800"
          style={{
            imageRendering: displayScale && displayScale < 0.5 ? 'pixelated' : 'auto',
          }}
        />
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
            {displayScale && (
              <span className="text-yellow-500">
                {Math.round(displayScale * 100)}% zoom
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