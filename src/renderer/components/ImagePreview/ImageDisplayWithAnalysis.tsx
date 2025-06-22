import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageLoadResult, ANALYSIS_IPC_CHANNELS, AnalysisResult } from '@shared/types';
import { BasicDetectionOverlay } from './BasicDetectionOverlay';

interface ImageDisplayWithAnalysisProps {
  imageData: ImageLoadResult['data'];
  fileName: string;
  imagePath: string;
}

export const ImageDisplayWithAnalysis: React.FC<ImageDisplayWithAnalysisProps> = ({ 
  imageData, 
  fileName,
  imagePath 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [displayScale, setDisplayScale] = useState<number | null>(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clickDetections, setClickDetections] = useState<AnalysisResult[]>([]);

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
        
        // Update display dimensions
        if (imageRef.current) {
          const rect = imageRef.current.getBoundingClientRect();
          setDisplayDimensions({ width: rect.width, height: rect.height });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageData]);

  // Reset analysis when image changes
  useEffect(() => {
    setClickDetections([]);
  }, [imagePath]);



  const handleImageClick = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || !imageData || isAnalyzing) return;

    // Get click coordinates relative to the image
    const rect = imageRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Calculate the actual image coordinates (accounting for scaling)
    const scaleX = imageData.width / rect.width;
    const scaleY = imageData.height / rect.height;
    
    const actualX = Math.round(clickX * scaleX);
    const actualY = Math.round(clickY * scaleY);

    console.log('Image clicked at:', { 
      displayCoords: { x: clickX, y: clickY },
      actualCoords: { x: actualX, y: actualY },
      imageSize: { width: imageData.width, height: imageData.height },
      displaySize: { width: rect.width, height: rect.height }
    });

    setIsAnalyzing(true);

    try {
      const result = await window.electronAPI.invoke(
        ANALYSIS_IPC_CHANNELS.IMAGE_ANALYZE_CLICK,
        imagePath,
        actualX,
        actualY
      );

      if (result.success) {
        setClickDetections(prev => [...prev, result]);
        console.log(`Click detection found ${result.detectedImages.length} sub-images in ${result.analysisTime}ms`);
      } else {
        console.error('Click analysis failed:', result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error during click analysis:', error);
      // TODO: Show error message to user
    } finally {
      setIsAnalyzing(false);
    }
  }, [imagePath, imageData, isAnalyzing]);

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
      {/* Image container with overlay */}
      <div ref={imageContainerRef} className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="relative">
          <img
            ref={imageRef}
            src={imageData.base64}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-dark-800 cursor-crosshair"
            style={{
              imageRendering: displayScale && displayScale < 0.5 ? 'pixelated' : 'auto',
            }}
            onLoad={() => {
              if (imageRef.current) {
                const rect = imageRef.current.getBoundingClientRect();
                setDisplayDimensions({ width: rect.width, height: rect.height });
              }
            }}
            onClick={handleImageClick}
          />
          
          {/* Detection overlay */}
          {clickDetections.some(d => d.detectedImages.length > 0) && (
            <BasicDetectionOverlay
              detectedImages={clickDetections.flatMap(d => d.detectedImages)}
              imageWidth={imageData.width}
              imageHeight={imageData.height}
              displayWidth={displayDimensions.width}
              displayHeight={displayDimensions.height}
            />
          )}
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
            {displayScale && (
              <span className="text-yellow-500">
                {Math.round(displayScale * 100)}% zoom
              </span>
            )}
          </div>
          
          {/* Analysis results info */}
          {clickDetections.length > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-blue-500">
                {clickDetections.reduce((sum, d) => sum + d.detectedImages.length, 0)} detection{clickDetections.reduce((sum, d) => sum + d.detectedImages.length, 0) !== 1 ? 's' : ''} from {clickDetections.length} click{clickDetections.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        {/* Instructions and clear button */}
        <div className="space-y-2">
          <div className="text-sm text-dark-300 text-center">
            Click on the image to detect sub-images at specific locations
          </div>
          
          {clickDetections.length > 0 && (
            <button
              onClick={() => setClickDetections([])}
              className="w-full px-3 py-2 text-sm bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
              disabled={isAnalyzing}
            >
              Clear Detections ({clickDetections.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 