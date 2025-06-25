import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  ImageState,
  ImageLoadResult,
  ViewportFrameResult,
} from "@shared/types";
import { IPC_CHANNELS } from "@shared/constants";
import { useDebouncedCallback } from 'use-debounce';

const initialState: ImageState = {
  loading: false,
  loaded: false,
  error: null,
  imageData: null,
  imagePath: null,
  viewportPreviews: [], // TODO: Should be a map by viewport frame id
};

interface ImageStoreContextType extends ImageState {
  loadImage: (imagePath: string) => Promise<void>;
  clearImage: () => void;
  updateViewportFrameRotation: (frameId: string, rotation: number) => void;
  updateViewportPreview: (frameId: string, imagePath: string) => void;
  addViewportPreview: (viewportPreview: ViewportFrameResult) => void;
  clearViewportPreviews: () => void;
  removeViewportPreview: (frameId: string) => void;
}

const ImageStoreContext = createContext<ImageStoreContextType | undefined>(
  undefined
);

interface ImageStoreProviderProps {
  children: ReactNode;
}

export const ImageStoreProvider: React.FC<ImageStoreProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<ImageState>(initialState);

  const loadImage = useCallback(async (imagePath: string) => {
    // Set loading state and clear previous viewport previews
    setState({
      ...initialState,
      loading: true,
      imagePath,
    });

    try {
      // Call IPC to load image
      const result = (await window.electronAPI.invoke(
        IPC_CHANNELS.IMAGE_LOAD,
        imagePath
      )) as ImageLoadResult;

      if (result.success && result.data) {
        setState({
          loading: false,
          loaded: true,
          error: null,
          imageData: result.data,
          imagePath,
          viewportPreviews: [],
        });
      } else {
        setState({
          loading: false,
          loaded: false,
          error: result.error || "Failed to load image",
          imageData: null,
          imagePath,
          viewportPreviews: [],
        });
      }
    } catch (error) {
      setState({
        loading: false,
        loaded: false,
        error: error instanceof Error ? error.message : "Unknown error",
        imageData: null,
        imagePath,
        viewportPreviews: [],
      });
    }
  }, []);

  const clearImage = useCallback(() => {
    setState(initialState);
  }, []);

  const updateViewportPreview = useDebouncedCallback(
    async (frameId: string, imagePath: string) => {
      const viewportFrame = state.viewportPreviews.find(
        (p) => p.viewportFrame?.id === frameId
      )?.viewportFrame;
      if (!viewportFrame) return;

      // TODO: This result should be made available to the corresponding viewport preview being rendered in right column
      const result = (await window.electronAPI.invoke(
        IPC_CHANNELS.GENERATE_VIEWPORT_PREVIEW,
        imagePath,
        viewportFrame
      )) as ViewportFrameResult;

      console.log('Updating viewport preview for frame:', frameId, 'result:', result);
      setState((prev) => ({
        ...prev,
        viewportPreviews: prev.viewportPreviews.some(
          (p) => p.viewportFrame?.id === viewportFrame.id
        )
          ? prev.viewportPreviews.map((p) =>
              p.viewportFrame?.id === viewportFrame.id ? result : p
            )
          : [...prev.viewportPreviews, result],
      }));
    },
   200
  );

  const addViewportPreview = useCallback(
    (viewportPreview: ViewportFrameResult) => {
      setState((prev) => ({
        ...prev,
        viewportPreviews: [...prev.viewportPreviews, viewportPreview],
      }));
    },
    []
  );

  // Clear viewport previews
  const clearViewportPreviews = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewportPreviews: [],
    }));
  }, []);

  // Remove specific viewport preview
  const removeViewportPreview = useCallback((frameId: string) => {
    setState((prev) => ({
      ...prev,
      viewportPreviews: prev.viewportPreviews.filter(
        (p) => p.viewportFrame?.id !== frameId
      ),
    }));
  }, []);

  const updateViewportFrameRotation = useCallback(
    (frameId: string, rotation: number) => {
      setState((prev) => ({
        ...prev,
        viewportPreviews: prev.viewportPreviews.reduce((acc, result) => {
          if (result.viewportFrame?.id === frameId) {
            acc.push({
              ...result,
              viewportFrame: { ...result.viewportFrame, rotation },
            });
          } else {
            acc.push(result);
          }
          return acc;
        }, [] as ViewportFrameResult[]),
      }));
    },
    []
  );

  const contextValue: ImageStoreContextType = {
    ...state,
    addViewportPreview,
    clearImage,
    clearViewportPreviews,
    loadImage,
    removeViewportPreview,
    updateViewportFrameRotation,
    updateViewportPreview,
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
    throw new Error("useImageStore must be used within an ImageStoreProvider");
  }
  return context;
};
