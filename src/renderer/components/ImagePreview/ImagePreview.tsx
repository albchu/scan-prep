import React, { useEffect } from 'react';
import { useImageStore } from '../../stores/imageStore';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageDisplayWithAnalysis } from './ImageDisplayWithAnalysis';

interface ImagePreviewProps {
  selectedImage: string | null;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ selectedImage }) => {
  const { loading, loaded, error, imageData, selectedPath, loadImage, clearImage } = useImageStore();

  useEffect(() => {
    if (selectedImage && selectedImage !== selectedPath) {
      loadImage(selectedImage);
    } else if (!selectedImage && selectedPath) {
      clearImage();
    }
  }, [selectedImage, selectedPath, loadImage, clearImage]);

  // Error state
  if (error) {
    return (
      <div className="empty-state">
        <div className="w-16 h-16 mx-auto mb-4 text-red-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="empty-state-title text-red-500">Error Loading Image</h3>
        <p className="empty-state-description">{error}</p>
        <button
          onClick={() => selectedImage && loadImage(selectedImage)}
          className="mt-4 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message="Loading image..." />
      </div>
    );
  }

  // Loaded state
  if (loaded && imageData && selectedImage) {
    const fileName = selectedImage.split('/').pop() || selectedImage.split('\\').pop() || 'Unknown';
    return <ImageDisplayWithAnalysis imageData={imageData} fileName={fileName} imagePath={selectedImage} />;
  }

  // Empty state
  return <EmptyState />;
}; 