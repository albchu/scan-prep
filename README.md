# Scan Prep - Image Splitting Tool

A desktop application for automatically detecting and extracting individual images from scanned documents containing multiple photos or images.

## Overview

Scan Prep helps digitize collections of physical photos by intelligently splitting multi-image scans into separate files. Perfect for:

- Digitizing photo albums
- Processing batch-scanned documents
- Separating collaged images
- Extracting individual photos from contact sheets

## Key Features

- **Automatic Image Detection**: Uses computer vision to identify individual images within a larger scan
- **Lossless Extraction**: Preserves original image quality without recompression
- **Batch Processing**: Process entire directories of scanned images
- **Smart Cropping**: Automatically removes borders and adjusts for rotation
- **Preview & Adjust**: Fine-tune detection results before saving
- **Multiple Format Support**: Works with JPEG, PNG, and TIFF files

## Application Interface

The application features an intuitive three-column layout:

1. **File Explorer**: Browse and select images or directories for processing
2. **Image Preview**: View the original scan with detection overlay
3. **Results Grid**: Preview extracted sub-images before saving

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Development

Start the development environment:
```bash
npm run dev
```

### Building

Build the application for production:
```bash
npm run build
```

### Other Commands

```bash
npm run clean          # Clean build artifacts
npm run lint           # Run code quality checks
npm run lint:fix       # Fix auto-fixable issues
npm run type-check     # Run TypeScript type checking
```

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: Modern UI library with component architecture
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Computer Vision**: Advanced image detection algorithms

## Documentation

- [Technical Design](docs/technical-design.md) - Architecture and design decisions
- [Implementation Details](docs/implementation-details.md) - Detailed implementation notes
- [Image Data Flow](docs/image-data-flow.md) - How image data flows through the application
- [Development Roadmap](docs/dev_roadmap.md) - Planned features and enhancements

## System Architecture

Scan Prep uses a modern Electron architecture with clear separation of concerns:

- **Main Process**: Handles file system operations, image processing, and native OS integration
- **Renderer Process**: React-based UI for smooth user interactions
- **IPC Bridge**: Secure communication between processes
- **Image Processing Pipeline**: Efficient handling of large image files

## Contributing

Contributions are welcome! Please read our contributing guidelines and check the development roadmap for planned features.

## License

MIT License - see LICENSE file for details. 