import React from "react";

interface RotateHandleIconProps {
  rotation: number;
  className?: string;
}

export const RotateHandleIcon: React.FC<RotateHandleIconProps> = ({ 
  rotation, 
  className 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#3b82f6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      width="16" 
      height="16"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M4 20V10a6 6 0 0 1 6 -6h10" strokeWidth="2" />
    </svg>
  );
}; 