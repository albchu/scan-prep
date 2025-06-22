import React, { useState, useCallback, useRef } from 'react';
import { DetectedSubImage } from '@shared/types';

interface InteractiveDetectionOverlayProps {
  detectedImages: DetectedSubImage[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
  onRotationChange: (detectionId: string, newRotation: number) => void;
}

export const InteractiveDetectionOverlay: React.FC<InteractiveDetectionOverlayProps> = ({
  detectedImages,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
  onRotationChange,
}) => {
  const [dragState, setDragState] = useState<{
    detectionId: string;
    startAngle: number;
    startRotation: number;
  } | null>(null);
  
  const overlayRef = useRef<SVGSVGElement>(null);

  // Calculate scale factors
  const scaleX = displayWidth / imageWidth;
  const scaleY = displayHeight / imageHeight;

  /**
   * Calculate the center point of a bounding box
   */
  const getCenter = useCallback((boundingBox: DetectedSubImage['boundingBox']) => ({
    x: (boundingBox.x + boundingBox.width / 2) * scaleX,
    y: (boundingBox.y + boundingBox.height / 2) * scaleY,
  }), [scaleX, scaleY]);

  /**
   * Calculate angle between center and mouse position
   */
  const calculateAngle = useCallback((centerX: number, centerY: number, mouseX: number, mouseY: number) => {
    return Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
  }, []);

  /**
   * Get mouse position relative to the SVG
   */
  const getMousePosition = useCallback((event: React.MouseEvent) => {
    if (!overlayRef.current) return { x: 0, y: 0 };
    
    const rect = overlayRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  /**
   * Handle rotation drag start
   */
  const handleRotationStart = useCallback((event: React.MouseEvent, detection: DetectedSubImage) => {
    event.preventDefault();
    event.stopPropagation();
    
    const mousePos = getMousePosition(event);
    const center = getCenter(detection.boundingBox);
    const startAngle = calculateAngle(center.x, center.y, mousePos.x, mousePos.y);
    
    setDragState({
      detectionId: detection.id,
      startAngle,
      startRotation: detection.userRotation,
    });
  }, [getMousePosition, getCenter, calculateAngle]);

  /**
   * Handle rotation drag
   */
  const handleRotationDrag = useCallback((event: React.MouseEvent) => {
    if (!dragState) return;
    
    const detection = detectedImages.find(d => d.id === dragState.detectionId);
    if (!detection) return;
    
    const mousePos = getMousePosition(event);
    const center = getCenter(detection.boundingBox);
    const currentAngle = calculateAngle(center.x, center.y, mousePos.x, mousePos.y);
    
    // Calculate rotation delta and apply to original rotation
    const angleDelta = currentAngle - dragState.startAngle;
    let newRotation = dragState.startRotation + angleDelta;
    
    // Normalize to -180 to 180 range
    while (newRotation > 180) newRotation -= 360;
    while (newRotation < -180) newRotation += 360;
    
    onRotationChange(detection.id, newRotation);
  }, [dragState, detectedImages, getMousePosition, getCenter, calculateAngle, onRotationChange]);

  /**
   * Handle rotation drag end
   */
  const handleRotationEnd = useCallback(() => {
    setDragState(null);
  }, []);

  /**
   * Calculate rotated rectangle corners
   */
  const getRotatedCorners = useCallback((detection: DetectedSubImage) => {
    const { boundingBox, userRotation } = detection;
    const centerX = (boundingBox.x + boundingBox.width / 2) * scaleX;
    const centerY = (boundingBox.y + boundingBox.height / 2) * scaleY;
    const width = boundingBox.width * scaleX;
    const height = boundingBox.height * scaleY;
    
    const angleRad = (userRotation * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    // Calculate corners relative to center, then rotate
    const corners = [
      { x: -halfWidth, y: -halfHeight }, // Top-left
      { x: halfWidth, y: -halfHeight },  // Top-right
      { x: halfWidth, y: halfHeight },   // Bottom-right
      { x: -halfWidth, y: halfHeight },  // Bottom-left
    ].map(corner => ({
      x: centerX + corner.x * cos - corner.y * sin,
      y: centerY + corner.x * sin + corner.y * cos,
    }));
    
    return corners;
  }, [scaleX, scaleY]);

  /**
   * Get rotation handle position (top-right corner + offset)
   */
  const getRotationHandlePosition = useCallback((detection: DetectedSubImage) => {
    const corners = getRotatedCorners(detection);
    const topRight = corners[1]; // Top-right corner
    
    // Offset the handle slightly outside the rectangle
    const handleOffset = 20;
    const center = getCenter(detection.boundingBox);
    const angle = Math.atan2(topRight.y - center.y, topRight.x - center.x);
    
    return {
      x: topRight.x + Math.cos(angle) * handleOffset,
      y: topRight.y + Math.sin(angle) * handleOffset,
    };
  }, [getRotatedCorners, getCenter]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ width: displayWidth, height: displayHeight }}>
      <svg
        ref={overlayRef}
        width={displayWidth}
        height={displayHeight}
        className="absolute top-0 left-0"
        style={{ width: displayWidth, height: displayHeight }}
        onMouseMove={handleRotationDrag}
        onMouseUp={handleRotationEnd}
        onMouseLeave={handleRotationEnd}
      >
        {detectedImages.map((detection) => {
          const corners = getRotatedCorners(detection);
          const handlePos = getRotationHandlePosition(detection);
          const center = getCenter(detection.boundingBox);
          
          // Create path for the rectangle
          const pathData = [
            `M ${corners[0].x} ${corners[0].y}`,
            `L ${corners[1].x} ${corners[1].y}`,
            `L ${corners[2].x} ${corners[2].y}`,
            `L ${corners[3].x} ${corners[3].y}`,
            'Z'
          ].join(' ');
          
          return (
            <g key={detection.id}>
              {/* Detection rectangle */}
              <path
                d={pathData}
                fill="none"
                stroke="#ff6b35"
                strokeWidth="2"
                opacity="0.8"
              />
              
              {/* Center point indicator */}
              <circle
                cx={center.x}
                cy={center.y}
                r="3"
                fill="#ff6b35"
                opacity="0.6"
              />
              
              {/* Rotation angle label */}
              {Math.abs(detection.userRotation) > 1 && (
                <text
                  x={center.x}
                  y={center.y - 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#ff6b35"
                  fontWeight="bold"
                >
                  {Math.round(detection.userRotation)}°
                </text>
              )}
              
              {/* Rotation handle */}
              <g 
                className="pointer-events-auto cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleRotationStart(e, detection)}
              >
                {/* Handle background circle */}
                <circle
                  cx={handlePos.x}
                  cy={handlePos.y}
                  r="12"
                  fill="white"
                  stroke="#ff6b35"
                  strokeWidth="2"
                  opacity="0.9"
                />
                
                {/* Rotation icon */}
                <path
                  d={`M ${handlePos.x - 6} ${handlePos.y - 3} 
                      A 6 6 0 1 1 ${handlePos.x + 3} ${handlePos.y - 6}
                      L ${handlePos.x + 6} ${handlePos.y - 6}
                      L ${handlePos.x + 3} ${handlePos.y - 9}
                      M ${handlePos.x + 6} ${handlePos.y + 3}
                      A 6 6 0 1 1 ${handlePos.x - 3} ${handlePos.y + 6}
                      L ${handlePos.x - 6} ${handlePos.y + 6}
                      L ${handlePos.x - 3} ${handlePos.y + 9}`}
                  stroke="#ff6b35"
                  strokeWidth="1.5"
                  fill="none"
                />
              </g>
              
              {/* Connection line from corner to handle */}
              <line
                x1={corners[1].x}
                y1={corners[1].y}
                x2={handlePos.x}
                y2={handlePos.y}
                stroke="#ff6b35"
                strokeWidth="1"
                opacity="0.4"
                strokeDasharray="3,3"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}; 