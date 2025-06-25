import { useImageStore } from "@/renderer/stores/imageStore";
import { calculateImageCoordinates } from "@/renderer/utils/imageUtils";
import { IPC_CHANNELS } from "@/shared/constants";
import { ViewportFrame, ViewportFrameResult } from "@shared/types";
import React, { useCallback, useRef } from "react";
import { useRotationDrag } from "../../hooks/useRotationDrag";
import {
  calculateScaleFactors,
  getBoundingBoxCenter,
} from "../../utils/geometryUtils";

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
  const { addViewportPreview, imageData, imagePath } = useImageStore();
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

  const onDivMouseDown = (
    event: React.MouseEvent,
    viewportFrame: ViewportFrame
  ) => {
    // Stop propagation here to prevent background click
    event.stopPropagation();
    handleRotationStart(event, viewportFrame, overlayRef.current);
  };

  const handleImageClick = useCallback(
    async (event: React.MouseEvent<Element, MouseEvent>) => {
      const target = event.target as HTMLElement;
      const elementType = target.getAttribute("data-element-type");

      // When clicking a viewport frame, the user does not want to create another frame
      if (elementType === "viewport-frame" || !imageRef.current || !imageData)
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
      }
    },
    [imagePath, imageData, addViewportPreview, imageRef]
  );

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ width: displayWidth, height: displayHeight }}
      onClick={handleImageClick}
      data-element-type="overlay-background"
    >
      {viewportFrames.map((viewportFrame) => {
        const { x, y, width, height } = viewportFrame.boundingBox;
        const center = getBoundingBoxCenter(
          viewportFrame.boundingBox,
          scaleFactors
        );

        // Scale the position and size to match the display size
        const scaledX = x * scaleFactors.scaleX;
        const scaledY = y * scaleFactors.scaleY;
        const scaledWidth = width * scaleFactors.scaleX;
        const scaledHeight = height * scaleFactors.scaleY;

        return (
          <div
            key={viewportFrame.id}
            data-element-type="viewport-frame"
            data-frame-id={viewportFrame.id}
            className="absolute border-2 border-blue-500 cursor-move pointer-events-auto"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
              transform: `rotate(${viewportFrame.rotation}deg)`,
              transformOrigin: `${center.x - scaledX}px ${
                center.y - scaledY
              }px`,
            }}
            onMouseDown={(event) => onDivMouseDown(event, viewportFrame)}
          />
        );
      })}
    </div>
  );
};
