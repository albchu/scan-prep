import React from "react";
import { ViewportFrame, FrameEdge } from "@shared/types";
import { getBoundingBoxCenter } from "../../utils/geometryUtils";
import styles from "./ViewportFrameOverlay.module.css";
import { RotateHandle } from "./RotateHandle";

interface ViewportFrameOverlayProps {
  viewportFrame: ViewportFrame;
  scaleFactors: {
    scaleX: number;
    scaleY: number;
  };
  handleRotate: (event: React.MouseEvent, viewportFrame: ViewportFrame) => void;
  handleTranslate: (
    event: React.MouseEvent,
    viewportFrame: ViewportFrame
  ) => void;
  handleResize: (event: React.MouseEvent, viewportFrame: ViewportFrame, edge: FrameEdge) => void;
}

export const ViewportFrameOverlay: React.FC<ViewportFrameOverlayProps> = ({
  viewportFrame,
  scaleFactors,
  handleRotate,
  handleTranslate,
  handleResize,
}) => {
  console.log("ViewportFrameOverlay", {
    viewportFrame,
    handleTranslate,
    handleResize,
  });
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
      className={styles.container}
      style={{
        left: `${scaledX}px`,
        top: `${scaledY}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        transform: `rotate(${viewportFrame.rotation}deg)`,
        transformOrigin: `${center.x - scaledX}px ${center.y - scaledY}px`,
      }}
      onMouseDown={(event) => handleRotate(event, viewportFrame)}
    >
      {/* Top edge handle */}
      <div
        className={`${styles.resizeHandle} ${styles.resizeHandleTop}`}
        onMouseDown={(event) => {
          event.stopPropagation();
          handleResize(event, viewportFrame, 'top');
        }}
      />

      {/* Right edge handle */}
      <div
        className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
        onMouseDown={(event) => {
          event.stopPropagation();
          handleResize(event, viewportFrame, 'right');
        }}
      />

      {/* Bottom edge handle */}
      <div
        className={`${styles.resizeHandle} ${styles.resizeHandleBottom}`}
        onMouseDown={(event) => {
          event.stopPropagation();
          handleResize(event, viewportFrame, 'bottom');
        }}
      />

      {/* Left edge handle */}
      <div
        className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
        onMouseDown={(event) => {
          event.stopPropagation();
          handleResize(event, viewportFrame, 'left');
        }}
      />

      <RotateHandle
        viewportFrame={viewportFrame}
        position="topLeft"
        handleRotate={handleRotate}
      />

      <RotateHandle
        viewportFrame={viewportFrame}
        position="topRight"
        handleRotate={handleRotate}
      />

      <RotateHandle
        viewportFrame={viewportFrame}
        position="bottomLeft"
        handleRotate={handleRotate}
      />

      <RotateHandle
        viewportFrame={viewportFrame}
        position="bottomRight"
        handleRotate={handleRotate}
      />
    </div>
  );
};
