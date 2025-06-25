import { useImageStore } from "@/renderer/stores/imageStore";
import { calculateImageCoordinates } from "@/renderer/utils/imageUtils";
import { generateViewportFrameIpc } from "../../services/ipc-requests";
import { ViewportFrame } from "@shared/types";
import React, { useCallback, useRef } from "react";
import { useRotationDrag } from "../../hooks/useRotationDrag";
import { calculateScaleFactors } from "../../utils/geometryUtils";
import { ViewportFrameOverlay } from "./ViewportFrameOverlay";

interface InteractiveViewportFrameOverlayProps {
  viewportFrames: ViewportFrame[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  onRotationChange: (frameId: string, newRotation: number) => void;
  imageRef: React.RefObject<HTMLImageElement>;
}

export const FramesOverlay: React.FC<InteractiveViewportFrameOverlayProps> = ({
  viewportFrames,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  onRotationChange,
  imageRef,
}) => {
  const { addViewportPreview, removeViewportPreview, imageData, imagePath, updateViewportFrameBoundingBox, updateViewportPreview } = useImageStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate scale factors
  const scaleFactors = calculateScaleFactors(
    imageWidth,
    imageHeight,
    displayWidth,
    displayHeight
  );

  // Use rotation drag hook
  const { handleRotationStart } = useRotationDrag({
    viewportFrames,
    scaleFactors,
    onRotationChange,
  });

  const handleRotate = useCallback((
    event: React.MouseEvent,
    viewportFrame: ViewportFrame
  ) => {
    handleRotationStart(event, viewportFrame, overlayRef.current);
  }, [handleRotationStart]);

  const handleTranslate = useCallback((
    event: React.MouseEvent,
    viewportFrame: ViewportFrame
  ) => {
    console.log("handleTranslate called for frame:", viewportFrame.id);
    // TODO: Implement translation functionality
  }, []);

  const handleResize = useCallback((
    event: React.MouseEvent,
    viewportFrame: ViewportFrame,
    edge: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    console.log("handleResize called for frame:", viewportFrame.id, "edge:", edge);
    // TODO: Implement resize functionality using useResizeDrag hook
    // This will be implemented in Phase 2
  }, []);

  const handleLeftClick = useCallback(
    async (event: React.MouseEvent<Element, MouseEvent>) => {
      const target = event.target as HTMLElement;
      const elementType = target.getAttribute("data-element-type");

      // When clicking a viewport frame, the user does not want to create another frame
      if (elementType === "viewport-frame" || !imageRef.current || !imageData || !imagePath)
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

      try {
        const result = await generateViewportFrameIpc(
          imagePath,
          imageCoords.x,
          imageCoords.y
        );

        if (result.success) {
          addViewportPreview(result);
        } else {
          console.error("Click analysis failed:", result.error);
          // TODO: Show error message to user
        }
      } catch (error) {
        console.error("Error during click analysis:", error);
        // TODO: Show error message to user
      }
    },
    [imagePath, imageData, addViewportPreview, imageRef]
  );

  const handleRightClick = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>) => {
      event.preventDefault(); // Prevent context menu
      
      const target = event.target as HTMLElement;
      const elementType = target.getAttribute("data-element-type");

      // Only handle right clicks on viewport frames
      if (elementType === "viewport-frame") {
        const frameId = target.getAttribute("data-frame-id");
        if (frameId) {
          removeViewportPreview(frameId);
        }
      }
    },
    [removeViewportPreview]
  );

  const handleImageClick = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>) => {
      if (event.button === 0) {
        // Left click
        handleLeftClick(event);
      } else if (event.button === 2) {
        // Right click
        handleRightClick(event);
      }
    },
    [handleLeftClick, handleRightClick]
  );

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ width: displayWidth, height: displayHeight }}
      onMouseDown={handleImageClick}
      onContextMenu={handleRightClick}
      data-element-type="overlay-background"
    >
      {viewportFrames.map((viewportFrame) => (
        <ViewportFrameOverlay
          key={viewportFrame.id}
          viewportFrame={viewportFrame}
          scaleFactors={scaleFactors}
          handleRotate={handleRotate}
          handleTranslate={handleTranslate}
          handleResize={handleResize}
        />
      ))}
    </div>
  );
};
