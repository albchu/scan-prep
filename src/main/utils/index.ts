// Boundary detection utilities
export type {
  Direction,
  Point,
} from './boundaryDetection';

export {
  TRAVERSE_DIRECTIONS,
  getImageEdge,
  traverseDirection,
  detectBoundaryPoints,
} from './boundaryDetection';

// Image validation and processing utilities
export {
  validateClickCoordinates,
  getBackgroundColor,
  calculateBoundingBox,
  createDetectedSubImage,
} from './imageValidation';

// Debug utilities
export {
  isDebugMode,
  saveDebugImage,
} from './debugUtils'; 