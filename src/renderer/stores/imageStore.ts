import { useState, useCallback } from 'react';
import { ImageState, IMAGE_IPC_CHANNELS, ImageLoadResult } from '@shared/types';

const initialState: ImageState = {
  loading: false,
  loaded: false,
  error: null,
  imageData: null,
  selectedPath: null,
};

export const useImageStore = () => {
  const [state, setState] = useState<ImageState>(initialState);

  const loadImage = useCallback(async (imagePath: string) => {
    // Set loading state
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
        });
      } else {
        setState({
          loading: false,
          loaded: false,
          error: result.error || 'Failed to load image',
          imageData: null,
          selectedPath: imagePath,
        });
      }
    } catch (error) {
      setState({
        loading: false,
        loaded: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        imageData: null,
        selectedPath: imagePath,
      });
    }
  }, []);

  const clearImage = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    loadImage,
    clearImage,
  };
}; 