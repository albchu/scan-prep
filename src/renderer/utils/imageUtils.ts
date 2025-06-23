/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate image coordinates from display click coordinates
 */
export function calculateImageCoordinates(
  clickX: number,
  clickY: number,
  displayRect: DOMRect,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  // Calculate the actual image coordinates (accounting for scaling)
  const scaleX = imageWidth / displayRect.width;
  const scaleY = imageHeight / displayRect.height;
  
  return {
    x: Math.round(clickX * scaleX),
    y: Math.round(clickY * scaleY),
  };
}

/**
 * Calculate display scale for showing zoom level
 */
export function calculateDisplayScale(
  imageWidth: number,
  imageHeight: number,
  displayWidth: number,
  displayHeight: number
): number {
  return Math.min(displayWidth / imageWidth, displayHeight / imageHeight);
}

/**
 * Determine appropriate image rendering style based on scale
 */
export function getImageRenderingStyle(scale: number): React.CSSProperties['imageRendering'] {
  return scale < 0.5 ? 'pixelated' : 'auto';
} 