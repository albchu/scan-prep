import React from "react";
import { ViewportFrame } from "@shared/types";
import { RotateHandleIcon } from "./RotateHandleIcon";
import styles from "./RotateHandle.module.css";

interface RotateHandleProps {
  viewportFrame: ViewportFrame;
  position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  handleRotate: (event: React.MouseEvent, viewportFrame: ViewportFrame) => void;
}

const getRotationByPosition = (position: string): number => {
  switch (position) {
    case "topLeft":
      return 0;
    case "topRight":
      return 90;
    case "bottomLeft":
      return -90;
    case "bottomRight":
      return 180;
    default:
      return 0;
  }
};

export const RotateHandle: React.FC<RotateHandleProps> = ({
  viewportFrame,
  position,
  handleRotate,
}) => {
  const rotation = getRotationByPosition(position);
  const positionClass = styles[position];

  return (
    <div 
      className={`${styles.rotateHandle} ${positionClass}`}
      onMouseDown={(event) => {
        event.stopPropagation();
        handleRotate(event, viewportFrame);
      }}
    >
      <RotateHandleIcon rotation={rotation} className={styles.rotateHandleIcon} />
    </div>
  );
}; 