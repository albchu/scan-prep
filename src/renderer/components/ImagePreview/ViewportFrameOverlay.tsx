import React from "react";
import { ViewportFrame } from "@shared/types";
import { getBoundingBoxCenter } from "../../utils/geometryUtils";

interface ViewportFrameOverlayProps {
  viewportFrame: ViewportFrame;
  scaleFactors: {
    scaleX: number;
    scaleY: number;
  };
  handleRotate: (event: React.MouseEvent, viewportFrame: ViewportFrame) => void;
  handleTranslate: (event: React.MouseEvent, viewportFrame: ViewportFrame) => void;
  handleResize: (event: React.MouseEvent, viewportFrame: ViewportFrame) => void;
}

export const ViewportFrameOverlay: React.FC<ViewportFrameOverlayProps> = ({
  viewportFrame,
  scaleFactors,
  handleRotate,
  handleTranslate,
  handleResize,
}) => {
  const { x, y, width, height } = viewportFrame.boundingBox;
  const center = getBoundingBoxCenter(viewportFrame.boundingBox, scaleFactors);

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
        transformOrigin: `${center.x - scaledX}px ${center.y - scaledY}px`,
      }}
      onMouseDown={(event) => handleRotate(event, viewportFrame)}
    />
  );
}; 