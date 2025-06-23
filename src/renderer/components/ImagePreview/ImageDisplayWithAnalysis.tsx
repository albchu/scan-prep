import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageLoadResult, ANALYSIS_IPC_CHANNELS, AnalysisResult, DetectedSubImage } from '@shared/types';
import { InteractiveDetectionOverlay } from './InteractiveDetectionOverlay';
import { useImageStore } from '../../stores/imageStore';

interface ImageDisplayWithAnalysisProps {
  imagePath: string;
  fileName: string;
  imageData: ImageLoadResult['data'];
}

export const ImageDisplayWithAnalysis: React.FC<ImageDisplayWithAnalysisProps> = ({
  imagePath,
  fileName,
  imageData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [displayScale, setDisplayScale] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [clickDetections, setClickDetections] = useState<AnalysisResult[]>([]);

  // Track last viewport preview rotations to avoid unnecessary regeneration
  const lastPreviewRotations = useRef<Map<string, number>>(new Map());
  const previewUpdateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { generateViewportPreview, clearViewportPreviews } = useImageStore();

  // Function to update display dimensions and scale
  const updateDisplayDimensions = useCallback(() => {
    if (imageRef.current && imageData) {
      const rect = imageRef.current.getBoundingClientRect();
      const scale = Math.min(rect.width / imageData.width, rect.height / imageData.height);
      
      console.log('Updating display dimensions:', {
        rectWidth: rect.width,
        rectHeight: rect.height,
        imageWidth: imageData.width,
        imageHeight: imageData.height,
        scale
      });
      
      setDisplayScale(scale);
      setDisplayDimensions({ width: rect.width, height: rect.height });
    }
  }, [imageData]);

  // Update dimensions when image loads
  useEffect(() => {
    updateDisplayDimensions();
  }, [imageData, updateDisplayDimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateDisplayDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDisplayDimensions]);

  // Also handle ResizeObserver for more responsive updates
  useEffect(() => {
    if (!imageRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      updateDisplayDimensions();
    });

    resizeObserver.observe(imageRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDisplayDimensions]);

  // Debounced viewport preview update function
  const debouncedUpdateViewportPreview = useCallback((detectionId: string, detection: DetectedSubImage, delay: number = 300) => {
    // Clear existing timeout for this detection
    const existingTimeout = previewUpdateTimeouts.current.get(detectionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      const lastRotation = lastPreviewRotations.current.get(detectionId);
      const currentRotation = detection.userRotation;
      
      // Only update if rotation has changed significantly (more than 1 degree) or if it's the first time
      if (lastRotation === undefined || Math.abs(currentRotation - lastRotation) > 1) {
        console.log(`Updating viewport preview for ${detectionId}: ${lastRotation}° → ${currentRotation}°`);
        lastPreviewRotations.current.set(detectionId, currentRotation);
        
        if (imagePath) {
          generateViewportPreview(imagePath, detection);
        }
      }
      
      previewUpdateTimeouts.current.delete(detectionId);
    }, delay);

    previewUpdateTimeouts.current.set(detectionId, timeout);
  }, [imagePath, generateViewportPreview]);

  // Generate viewport previews when detections change (initial creation only)
  useEffect(() => {
    const allDetections = clickDetections.flatMap(d => d.detectedImages);
    allDetections.forEach(detection => {
      // Only generate preview if we haven't seen this detection before
      if (!lastPreviewRotations.current.has(detection.id) && imagePath) {
        console.log(`Initial viewport preview for ${detection.id}`);
        lastPreviewRotations.current.set(detection.id, detection.userRotation);
        generateViewportPreview(imagePath, detection);
      }
    });
  }, [clickDetections, imagePath, generateViewportPreview]);

  // Clean up tracking when detections are cleared
  useEffect(() => {
    if (clickDetections.length === 0) {
      lastPreviewRotations.current.clear();
      // Clear any pending timeouts
      previewUpdateTimeouts.current.forEach(timeout => clearTimeout(timeout));
      previewUpdateTimeouts.current.clear();
    }
  }, [clickDetections.length]);

  /**
   * Handle rotation change from the interactive overlay (now debounced)
   */
  const handleRotationChange = useCallback((detectionId: string, newRotation: number) => {
    // Update the detection state immediately for smooth UI
    setClickDetections(prev => prev.map(result => ({
      ...result,
      detectedImages: result.detectedImages.map(detection => 
        detection.id === detectionId 
          ? { ...detection, userRotation: newRotation }
          : detection
      )
    })));

    // Find the updated detection and debounce the viewport preview update
    const updatedDetection = clickDetections
      .flatMap(d => d.detectedImages)
      .find(d => d.id === detectionId);
      
    if (updatedDetection) {
      const detectionWithNewRotation = { ...updatedDetection, userRotation: newRotation };
      debouncedUpdateViewportPreview(detectionId, detectionWithNewRotation);
    }
  }, [clickDetections, debouncedUpdateViewportPreview]);

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

  const handleClearDetections = useCallback(() => {
    setClickDetections([]);
    clearViewportPreviews();
  }, [clearViewportPreviews]);

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
            onLoad={updateDisplayDimensions}
            onClick={handleImageClick}
          />
          
          {/* Interactive detection overlay with rotation handles */}
          {clickDetections.some(d => d.detectedImages.length > 0) && displayDimensions.width > 0 && displayDimensions.height > 0 && (
            <InteractiveDetectionOverlay
              detectedImages={clickDetections.flatMap(d => d.detectedImages)}
              imageWidth={imageData.width}
              imageHeight={imageData.height}
              displayWidth={displayDimensions.width}
              displayHeight={displayDimensions.height}
              onRotationChange={handleRotationChange}
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
              {clickDetections.some(d => d.detectedImages.some(img => Math.abs(img.userRotation) > 1)) && (
                <span className="text-orange-500 ml-2">
                  (rotated)
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Instructions and clear button */}
        <div className="space-y-2">
          <div className="text-sm text-dark-300 text-center">
            Click on the image to detect sub-images • Drag rotation handles to adjust angles
          </div>
          
          {clickDetections.length > 0 && (
            <button
              onClick={handleClearDetections}
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