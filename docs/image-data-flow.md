# Image Data Flow in Scan Prep

This document explains how image data flows from the file system to the UI in the Scan Prep Electron application.

## Overview

The image data flow follows a multi-layered architecture that separates concerns between the main process (backend) and renderer process (frontend) in Electron. The flow ensures secure and efficient image loading while maintaining proper separation of concerns.

## Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   File System   │────▶│ ImageProcessor   │────▶│  IPC Handlers   │────▶│ Image Store  │
│  (Image File)   │     │ (Main Process)   │     │   (Bridge)      │     │  (Renderer)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
                                                                                    │
                                                                                    ▼
                                                                            ┌──────────────┐
                                                                            │ UI Components│
                                                                            │ (React)      │
                                                                            └──────────────┘
```

## Detailed Flow

### 1. Image Processing (Main Process)

The `ImageProcessor` service (`src/main/services/ImageProcessor.ts`) handles the core image loading logic:

```typescript
async loadImage(imagePath: string): Promise<ImageLoadResult>
```

**Key responsibilities:**
- Validates the file exists and is a supported format
- Reads the image file as a Buffer
- Converts the buffer to base64 encoding
- Creates a data URL with format: `data:${mimeType};base64,${base64}`
- Extracts basic metadata (dimensions, size, format)

**Return structure:**
```typescript
{
  success: boolean,
  data?: {
    base64: string,        // Data URL for direct rendering
    width: number,         // Image width in pixels
    height: number,        // Image height in pixels
    format: string,        // File format (JPG, PNG, etc.)
    size: number          // File size in bytes
  },
  error?: string          // Error message if loading fails
}
```

### 2. IPC Communication Layer

The IPC handlers (`src/main/ipc-handlers.ts`) expose the image loading functionality to the renderer process:

```typescript
ipcMain.handle(IMAGE_IPC_CHANNELS.IMAGE_LOAD, async (event, imagePath: string) => {
  const result = await this.imageProcessor.loadImage(imagePath);
  return result;
});
```

**Key features:**
- Uses Electron's secure IPC mechanism
- Handles errors gracefully
- Provides logging for debugging

### 3. Renderer Process - Image Store

The image store (`src/renderer/stores/imageStore.ts`) manages the image state in the UI:

```typescript
const loadImage = async (imagePath: string) => {
  // Set loading state
  setState({ loading: true, imagePath });
  
  // Call IPC to load image
  const result = await window.electronAPI.invoke(
    IMAGE_IPC_CHANNELS.IMAGE_LOAD,
    imagePath
  );
  
  // Update state with result
  setState({
    loading: false,
    loaded: result.success,
    imageData: result.data,
    error: result.error
  });
};
```

**State management:**
- `loading`: Indicates image is being loaded
- `loaded`: Indicates successful load
- `error`: Contains error message if load failed
- `imageData`: Contains the image data and metadata
- `imagePath`: Currently selected image path

### 4. UI Components

The image is displayed through a hierarchy of React components:

#### ImagePreview Component
(`src/renderer/components/ImagePreview/ImagePreview.tsx`)

- Monitors `selectedImage` prop for changes
- Triggers image loading when selection changes
- Manages different UI states (loading, error, loaded)

#### ImageDisplay Component
(`src/renderer/components/ImagePreview/ImageDisplay.tsx`)

- Renders the actual image using the base64 data URL
- Displays image metadata (dimensions, format, size)
- Handles responsive scaling and zoom display

**Image rendering:**
```tsx
<img
  src={imageData.base64}  // Direct data URL rendering
  alt={fileName}
  className="max-w-full max-h-full object-contain"
/>
```

## Security Considerations

### Why Base64 Data URLs?

The application uses base64-encoded data URLs instead of file:// URLs for several reasons:

1. **Security**: Avoids file:// protocol restrictions in Electron
2. **Consistency**: Works the same across different platforms
3. **Isolation**: Keeps file system access in the main process only
4. **Simplicity**: No need for custom protocols or file serving

### Performance Notes

While base64 encoding increases the data size by ~33%, for this application:
- Images are loaded one at a time (not in bulk)
- The UI responsiveness benefit outweighs the size overhead
- Future optimization could implement streaming for very large images

## Supported Image Formats

The application currently supports:
- `.jpg` / `.jpeg` - JPEG images
- `.png` - PNG images
- `.tiff` / `.tif` - TIFF images

Format support is defined in `APP_CONSTANTS.SUPPORTED_IMAGE_FORMATS`.

## Error Handling

The system handles various error scenarios:

1. **File not found**: Returns error in `ImageLoadResult`
2. **Unsupported format**: Validates extension before loading
3. **Read permissions**: Caught and returned as error
4. **Corrupt images**: Currently returns with default dimensions

## Future Enhancements

Potential improvements to the image data flow:

1. **Streaming**: For very large images, implement chunked loading
2. **Caching**: Cache loaded images to improve performance
3. **Thumbnails**: Generate thumbnails for faster preview
4. **Advanced metadata**: Extract EXIF, color profile information
5. **Image processing**: Add rotation, crop, basic adjustments

## Related Documentation

- [Technical Design](./technical-design.md) - Overall application architecture
- [Implementation Details](./implementation-details.md) - Detailed implementation notes
- [Phase 4 Development](./dev_summary_phase_4.md) - Image preview implementation phase 