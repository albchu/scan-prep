import React, { useRef, useEffect, useState, useCallback } from "react";
import { ImageLoadResult, ViewportFrameResult } from "@shared/types";
import { IPC_CHANNELS } from "@shared/constants";
import { FramesOverlay } from "./FramesOverlay";
import { useImageStore } from "../../stores/imageStore";
import {
  formatFileSize,
  calculateImageCoordinates,
  calculateDisplayScale,
  getImageRenderingStyle,
} from "../../utils/imageUtils";

interface ImageBoardProps {
  imagePath: string;
  fileName: string;
  imageData: ImageLoadResult["data"];
}

export const ImageBoard: React.FC<ImageBoardProps> = ({
  imagePath,
  fileName,
  imageData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [displayDimensions, setDisplayDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [displayScale, setDisplayScale] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    clearViewportPreviews,
    viewportPreviews,
    addViewportPreview,
    updateViewportFrameRotation,
    updateViewportPreview,
  } = useImageStore();

  // Function to update display dimensions and scale
  const updateDisplayDimensions = useCallback(() => {
    if (imageRef.current && imageData) {
      const rect = imageRef.current.getBoundingClientRect();
      const scale = calculateDisplayScale(
        imageData.width,
        imageData.height,
        rect.width,
        rect.height
      );

      console.log("Updating display dimensions:", {
        rectWidth: rect.width,
        rectHeight: rect.height,
        imageWidth: imageData.width,
        imageHeight: imageData.height,
        scale,
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

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const handleRotationChange = useCallback(
    (frameId: string, newRotation: number) => {
      updateViewportFrameRotation(frameId, newRotation);
      updateViewportPreview(frameId, imagePath);
    },
    [updateViewportFrameRotation, updateViewportPreview, imagePath]
  );

  const handleImageClick = useCallback(
    async (event: React.MouseEvent<Element, MouseEvent>) => {
      const target = event.target as HTMLElement;
      const elementType = target.getAttribute("data-element-type");

      // When clicking a viewport frame, the user does not want to create another frame
      if (
        elementType === "viewport-frame" ||
        !imageRef.current ||
        !imageData ||
        isAnalyzing
      )
        return;

      // Get click coordinates relative to the image
      const rect = imageRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Calculate the actual image coordinates
      const imageCoords = calculateImageCoordinates(
        clickX,
        clickY,
        rect,
        imageData.width,
        imageData.height
      );

      console.log("Image clicked at:", {
        displayCoords: { x: clickX, y: clickY },
        actualCoords: imageCoords,
        imageSize: { width: imageData.width, height: imageData.height },
        displaySize: { width: rect.width, height: rect.height },
      });

      setIsAnalyzing(true);

      try {
        const result = (await window.electronAPI.invoke(
          IPC_CHANNELS.GENERATE_VIEWPORT_FRAME,
          imagePath,
          imageCoords.x,
          imageCoords.y
        )) as ViewportFrameResult;

        if (result.success) {
          addViewportPreview(result);
        } else {
          console.error("Click analysis failed:", result.error);
          // TODO: Show error message to user
        }
      } catch (error) {
        console.error("Error during click analysis:", error);
        // TODO: Show error message to user
      } finally {
        setIsAnalyzing(false);
      }
    },
    [imagePath, imageData, isAnalyzing, addViewportPreview]
  );

  if (!imageData) {
    return null;
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Image container with overlay */}
      <div
        ref={imageContainerRef}
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
      >
        <div className="relative">
          <img
            ref={imageRef}
            src={imageData.base64}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-dark-800"
            style={{
              imageRendering: displayScale
                ? getImageRenderingStyle(displayScale)
                : "auto",
            }}
            onLoad={updateDisplayDimensions}
          />

          <FramesOverlay
            viewportFrames={viewportPreviews
              .filter((d) => !d.error && d.viewportFrame)
              .map((d) => d.viewportFrame!)}
            imageWidth={imageData.width}
            imageHeight={imageData.height}
            displayWidth={displayDimensions.width}
            displayHeight={displayDimensions.height}
            onRotationChange={handleRotationChange}
            handleImageClick={handleImageClick}
          />
        </div>
      </div>

      {/* Bottom section with file info and action button */}
      <div className="p-4 border-t border-dark-700 space-y-3">
        {/* File info */}
        <div>
          <h3 className="text-lg font-medium text-dark-100 truncate">
            {fileName}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
            <span>
              {imageData.width} × {imageData.height}px
            </span>
            <span>{imageData.format}</span>
            <span>{formatFileSize(imageData.size)}</span>
            {displayScale && (
              <span className="text-yellow-500">
                {Math.round(displayScale * 100)}% zoom
              </span>
            )}
          </div>

          {/* Analysis results info */}
          {viewportPreviews.length > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-blue-500">
                {viewportPreviews.length} viewport frame
                {viewportPreviews.length !== 1 ? "s" : ""} from{" "}
                {viewportPreviews.length} click
                {viewportPreviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Instructions and clear button */}
        <div className="space-y-2">
          <div className="text-sm text-dark-300 text-center">
            Click on the image to detect viewport frames • Drag rotation handles
            to adjust angles
          </div>

          {viewportPreviews.length > 0 && (
            <button
              onClick={clearViewportPreviews}
              className="w-full px-3 py-2 text-sm bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
              disabled={isAnalyzing}
            >
              Clear Viewport Frames ({viewportPreviews.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
