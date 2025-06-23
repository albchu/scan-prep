import React from 'react';
import { ViewportPreviewResult } from '@shared/types';

interface ViewportPreviewProps {
  viewportPreview: ViewportPreviewResult;
}

export const ViewportPreview: React.FC<ViewportPreviewProps> = ({
  viewportPreview
}) => {
  const { base64, width, height, originalDetection, success, error } = viewportPreview;
  
  if (!success || !base64) {
    return (
      <div className="viewport-preview">
        <div className="preview-container">
          <div className="flex items-center justify-center h-full text-red-400 text-sm">
            Error: {error || 'Failed to generate preview'}
          </div>
        </div>
        <div className="preview-info">
          <span className="text-red-400">Failed</span>
        </div>
      </div>
    );
  }

  const aspectRatio = originalDetection.boundingBox.width / originalDetection.boundingBox.height;
  const isLandscape = aspectRatio > 1;
  const isPortrait = aspectRatio < 1;
  
  return (
    <div className="viewport-preview">
      <div className="preview-container">
        <img 
          src={base64} 
          alt={`Viewport preview ${originalDetection.id}`}
          className="preview-image"
          style={{
            maxWidth: '100%',
            maxHeight: '200px',
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>
      
      <div className="preview-info">
        <div className="flex items-center justify-between">
          <span className="dimensions text-dark-300">
            {width}×{height}px
          </span>
          <span className="confidence text-green-400">
            {Math.round(originalDetection.confidence * 100)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-dark-400">
            {Math.round(originalDetection.boundingBox.width)}×{Math.round(originalDetection.boundingBox.height)} region
          </span>
          <span className="text-dark-500">
            {isLandscape ? '🔄' : isPortrait ? '📱' : '⬜'} {aspectRatio.toFixed(2)}
          </span>
        </div>
        
        {Math.abs(originalDetection.userRotation) > 1 && (
          <div className="mt-1">
            <span className="rotation-indicator text-orange-400">
              ↻ {Math.round(originalDetection.userRotation)}°
            </span>
          </div>
        )}
      </div>
    </div>
  );
}; 