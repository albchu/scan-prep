import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ImageState, IMAGE_IPC_CHANNELS, ImageLoadResult, ViewportPreviewResult, VIEWPORT_IPC_CHANNELS, DetectedSubImage } from '@shared/types';

const initialState: ImageState = {
  loading: false,
  loaded: false,
  error: null,
  imageData: null,
  selectedPath: null,
  viewportPreviews: [],
};

interface ImageStoreContextType extends ImageState {
  loadImage: (imagePath: string) => Promise<void>;
  clearImage: () => void;
  generateViewportPreview: (imagePath: string, detection: DetectedSubImage) => Promise<void>;
  clearViewportPreviews: () => void;
  removeViewportPreview: (detectionId: string) => void;
}

const ImageStoreContext = createContext<ImageStoreContextType | undefined>(undefined);

interface ImageStoreProviderProps {
  children: ReactNode;
}

export const ImageStoreProvider: React.FC<ImageStoreProviderProps> = ({ children }) => {
  const [state, setState] = useState<ImageState>(initialState);

  const loadImage = useCallback(async (imagePath: string) => {
    // Set loading state and clear previous viewport previews
    setState({
      ...initialState,
      loading: true,
      selectedPath: imagePath,
    });

    try {
      // Call IPC to load image
      const result: ImageLoadResult = await window.electronAPI.invoke(
        IMAGE_IPC_CHANNELS.IMAGE_LOAD,
        imagePath
      );

      if (result.success && result.data) {
        setState({
          loading: false,
          loaded: true,
          error: null,
          imageData: result.data,
          selectedPath: imagePath,
          viewportPreviews: [],
        });
      } else {
        setState({
          loading: false,
          loaded: false,
          error: result.error || 'Failed to load image',
          imageData: null,
          selectedPath: imagePath,
          viewportPreviews: [],
        });
      }
    } catch (error) {
      setState({
        loading: false,
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        imageData: null,
        selectedPath: imagePath,
        viewportPreviews: [],
      });
    }
  }, []);

  const clearImage = useCallback(() => {
    setState(initialState);
  }, []);

  // Generate viewport preview
  const generateViewportPreview = useCallback(async (imagePath: string, detection: DetectedSubImage) => {
    try {
      console.log('Invoking viewport preview with channel:', VIEWPORT_IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW);
      
      // Calculate aspect-ratio-preserving preview size
      const { boundingBox } = detection;
      const aspectRatio = boundingBox.width / boundingBox.height;
      
      // Target maximum dimension (for grid layout)
      const maxDimension = 200;
      
      let previewWidth: number;
      let previewHeight: number;
      
      if (aspectRatio > 1) {
        // Landscape: width is larger
        previewWidth = maxDimension;
        previewHeight = Math.round(maxDimension / aspectRatio);
      } else {
        // Portrait or square: height is larger or equal
        previewHeight = maxDimension;
        previewWidth = Math.round(maxDimension * aspectRatio);
      }
      
      console.log(`Preview size for ${detection.id}: ${previewWidth}x${previewHeight} (aspect ratio: ${aspectRatio.toFixed(2)})`);
      
      const result = await window.electronAPI.invoke(
        VIEWPORT_IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW,
        imagePath,
        detection,
        { width: previewWidth, height: previewHeight }
      );
      
      if (result.success || !result.success) { // Include both success and error results
        setState(prev => ({
          ...prev,
          viewportPreviews: prev.viewportPreviews.some(p => p.id === detection.id)
            ? prev.viewportPreviews.map(p => p.id === detection.id ? result : p)
            : [...prev.viewportPreviews, result]
        }));
      }
    } catch (error) {
      console.error('Failed to generate viewport preview:', error);
      // Add error result to previews
      const errorResult: ViewportPreviewResult = {
        success: false,
        id: detection.id,
        originalDetection: detection,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setState(prev => ({
        ...prev,
        viewportPreviews: prev.viewportPreviews.some(p => p.id === detection.id)
          ? prev.viewportPreviews.map(p => p.id === detection.id ? errorResult : p)
          : [...prev.viewportPreviews, errorResult]
      }));
    }
  }, []);

  // Clear viewport previews
  const clearViewportPreviews = useCallback(() => {
    setState(prev => ({
      ...prev,
      viewportPreviews: []
    }));
  }, []);

  // Remove specific viewport preview
  const removeViewportPreview = useCallback((detectionId: string) => {
    setState(prev => ({
      ...prev,
      viewportPreviews: prev.viewportPreviews.filter(p => p.id !== detectionId)
    }));
  }, []);

  const contextValue: ImageStoreContextType = {
    ...state,
    loadImage,
    clearImage,
    generateViewportPreview,
    clearViewportPreviews,
    removeViewportPreview,
  };

  return (
    <ImageStoreContext.Provider value={contextValue}>
      {children}
    </ImageStoreContext.Provider>
  );
};

export const useImageStore = (): ImageStoreContextType => {
  const context = useContext(ImageStoreContext);
  if (context === undefined) {
    throw new Error('useImageStore must be used within an ImageStoreProvider');
  }
  return context;
}; 