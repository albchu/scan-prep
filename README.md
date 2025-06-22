# Scan Prep - Image Splitting Tool

Electron-based desktop application for lossless splitting of scanned images into separate sub-images.

## Phase 1 - Foundation Setup ✅

This is the Phase 1 implementation of the Scan Prep development roadmap, establishing the basic Electron + React + TypeScript foundation with a dark-themed 3-column layout.

### Completed Features

- ✅ Electron application with TypeScript configuration
- ✅ React setup with Tailwind CSS dark theme  
- ✅ Basic 3-column layout structure
- ✅ Window management and basic menu
- ✅ Development build pipeline with hot-reload

### Architecture

The application uses a clean separation between main and renderer processes:

- **Main Process** (`src/main/`): Electron window management and application lifecycle
- **Renderer Process** (`src/renderer/`): React UI with three-column layout
- **Shared** (`src/shared/`): Common types and constants

### UI Structure

The application features a responsive 3-column layout:

1. **Left Column - File Explorer**: Directory navigation and file selection (placeholder in Phase 1)
2. **Middle Column - Image Preview**: Image display and analysis controls (placeholder in Phase 1)  
3. **Right Column - Sub-Image Grid**: Extracted image results (placeholder in Phase 1)

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
```bash
npm install
```

### Development

Start the development environment with hot-reload:
```bash
npm run dev
```

This will:
- Build the application in development mode
- Start Electron with the built application
- Enable hot module replacement for fast development
- Open Developer Tools automatically

### Building

Build the application for production:
```bash
npm run build
```

### Other Commands

```bash
npm run clean          # Clean build artifacts
npm run lint           # Run ESLint code quality checks
npm run lint:fix       # Fix auto-fixable ESLint issues
npm run type-check     # Run TypeScript type checking
```

## Project Structure

```
scan-prep/
├── src/
│   ├── main/                          # Main process (Electron)
│   │   ├── main.ts                   # Application entry point
│   │   └── window-manager.ts         # Window creation/management
│   ├── renderer/                      # Renderer process (React)
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   └── ThreeColumnLayout.tsx
│   │   │   ├── FileExplorer/
│   │   │   │   └── FileExplorerPlaceholder.tsx
│   │   │   ├── ImagePreview/
│   │   │   │   └── ImagePreviewPlaceholder.tsx
│   │   │   └── SubImageGrid/
│   │   │       └── SubImageGridPlaceholder.tsx
│   │   ├── App.tsx                   # Main React component
│   │   ├── index.tsx                 # React entry point
│   │   ├── index.html                # HTML template
│   │   └── styles.css                # Tailwind CSS and custom styles
│   └── shared/                        # Shared types and constants
│       └── types.ts
├── docs/                              # Documentation
├── package.json                       # Dependencies and scripts
├── webpack.config.js                  # Build configuration
├── tailwind.config.js                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── README.md                         # This file
```

## Technology Stack

- **Electron 28**: Cross-platform desktop framework
- **React 18**: Component-based UI library
- **TypeScript 5**: Type-safe JavaScript
- **Tailwind CSS 3**: Utility-first CSS framework
- **Webpack 5**: Module bundling and build optimization

## Dark Theme

The application features a professional dark theme optimized for extended use:

- Consistent dark color palette throughout the interface
- High contrast for excellent readability
- Custom scrollbar styling
- Smooth animations and transitions
- Accessibility-focused design

## Next Steps

Phase 1 establishes the foundation. Future phases will add:

- **Phase 2**: Basic file navigation and directory browsing
- **Phase 3**: Advanced file explorer with thumbnails and metadata
- **Phase 4**: Image preview functionality
- **Phase 5**: Automatic sub-image detection with computer vision
- **And more...** (see `docs/dev_roadmap.md` for complete roadmap)

## Development Notes

- The application uses strict TypeScript configuration for type safety
- ESLint is configured for code quality with React and TypeScript rules
- Hot module replacement is enabled for fast development iteration
- All placeholder components include hints about future functionality

## Contributing

This project follows a phased development approach. Each phase has specific deliverables and acceptance criteria as outlined in the development roadmap.

## License

MIT License - see LICENSE file for details. 