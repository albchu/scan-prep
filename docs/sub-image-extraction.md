# Sub-Image Extraction Concepts

## Problem Overview

Flatbed scanners are commonly used to digitize multiple physical photographs or documents in a single scan. This creates a composite image containing several individual items that need to be separated into individual files. The challenge is to automatically detect and extract these sub-images while handling real-world variations in placement and orientation.

## Problem Constraints

### Scanner Environment Characteristics

1. **Consistent Background**: Scanner beds typically produce a uniform background (white, black, or grey), creating high contrast with the scanned items.

2. **Rectangular Items**: Most scanned items (photos, documents, cards) are rectangular in shape, though they may appear rotated in the scan.

3. **Variable Rotation**: Items placed on the scanner bed are rarely perfectly aligned. Rotation angles typically range from -45° to +45° degrees.

4. **Edge Shadows**: Physical items often create subtle shadows along their edges, which can aid in detection but must be handled correctly.

5. **Size Variations**: Items can range from small photos (3x5 inches) to full documents (8.5x11 inches), requiring flexible detection parameters.

### Quality Requirements

- **Lossless Extraction**: The extracted sub-images must maintain the original quality without recompression
- **Accurate Boundaries**: Detection should closely match the actual edges of the items
- **Rotation Preservation**: The system must detect and handle rotation to extract properly oriented images

## Algorithmic Approach

### Detection Pipeline

The sub-image extraction process follows a systematic pipeline:

1. **Preprocessing**
   - Convert to grayscale for edge detection
   - Apply Gaussian blur to reduce noise while preserving edges
   - Adaptive thresholding to handle varying lighting conditions

2. **Edge Detection**
   - Canny edge detection to identify boundaries
   - Morphological operations to close gaps and strengthen edges
   - Binary image generation for region analysis

3. **Region Identification**
   - Connected component analysis to identify distinct regions
   - Size filtering to remove noise and artifacts
   - Shape analysis to identify rectangular candidates

4. **Rectangle Fitting**
   - Contour extraction from each region
   - Minimum area rectangle calculation to handle rotation
   - Validation of rectangular properties (aspect ratio, angles)

5. **Extraction**
   - Rotation correction if needed
   - Precise cropping along detected boundaries
   - Lossless save of the extracted region

### Key Algorithms

**Canny Edge Detection**: Provides clean, continuous edges essential for identifying item boundaries. The multi-stage algorithm (gradient calculation, non-maximum suppression, hysteresis thresholding) is particularly effective for scanner images with their high contrast.

**Connected Component Labeling**: Groups adjacent pixels into distinct regions, allowing the identification of separate items in the scan. The two-pass algorithm efficiently labels regions in linear time.

**Minimum Area Rectangle**: For each detected region, finding the smallest rectangle that encloses all points determines both the bounds and rotation angle of the item. This is typically solved using the rotating calipers algorithm on the convex hull.

## Implementation with image-js

### Why image-js is Suitable

Image-js provides a strong foundation for the image processing pipeline:

- **Built-in Edge Detection**: Native support for Canny edge detection with customizable parameters
- **Morphological Operations**: Complete set of operations (dilate, erode, open, close) for edge refinement
- **ROI Management**: Region of Interest system for connected component analysis
- **Grayscale Conversion**: Multiple algorithms for optimal grayscale conversion
- **Lossless Operations**: Maintains image quality throughout processing

### Required Custom Implementations

While image-js handles the core image processing, the application must implement:

1. **Contour to Rectangle Conversion**
   - Extract precise contours from ROI boundaries
   - Calculate convex hull of contour points
   - Implement minimum area rectangle algorithm

2. **Rotation Detection and Correction**
   - Determine rotation angle from rectangle orientation
   - Apply rotation transformation during extraction

3. **Confidence Scoring**
   - Evaluate detection quality based on edge strength
   - Assess rectangular properties for validation

### Integration Strategy

The implementation leverages image-js for all image processing operations while adding geometric algorithms for rectangle detection:

```
Scanner Image → image-js Processing → ROI Detection → Custom Geometry → Extracted Images
```

This approach minimizes external dependencies while providing the specific functionality needed for scanner image processing. The modular design allows for future enhancements such as perspective correction or non-rectangular shape detection if requirements expand.

## Analysis Modes

The application supports multiple detection sensitivity levels:

- **Conservative**: High confidence threshold, minimal false positives
- **Balanced**: Standard detection for typical use cases  
- **Aggressive**: Lower thresholds to catch difficult items

Each mode adjusts edge detection sensitivity, minimum region size, and confidence thresholds to optimize for different scanning scenarios.
