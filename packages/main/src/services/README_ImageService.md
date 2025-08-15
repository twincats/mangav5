# ImageService Documentation

The ImageService provides comprehensive image processing capabilities including WebP conversion, resizing, manipulation, and batch processing using the Sharp library.

## Features

- **WebP Conversion**: Convert images to WebP format with configurable quality
- **Resizing**: Resize images while maintaining aspect ratio
- **Image Manipulation**: Apply various effects like brightness, contrast, blur, rotation, etc.
- **Thumbnail Creation**: Generate thumbnails with custom sizes
- **Batch Processing**: Process multiple images at once
- **Metadata Extraction**: Get detailed image information

## Usage

### Basic WebP Conversion

```typescript
import { ImageService } from './imageService.js';

// Simple conversion with default settings
const result = await ImageService.convertToWebP('/path/to/image.jpg');

// With custom options
const result = await ImageService.convertToWebP('/path/to/image.jpg', {
  quality: 90,
  resizeWidth: 800,
  deleteOriginal: true,
  outputPath: '/custom/output/path.webp'
});
```

### Image Resizing

```typescript
// Resize to specific width while maintaining aspect ratio
const result = await ImageService.resizeImage(
  '/path/to/image.jpg',
  1200, // target width
  '/path/to/resized.jpg', // optional output path
  false // delete original
);
```

### Image Manipulation

```typescript
const result = await ImageService.manipulateImage(
  '/path/to/image.jpg',
  {
    brightness: 0.2,    // Increase brightness by 20%
    contrast: 0.1,      // Increase contrast by 10%
    saturation: -0.3,   // Decrease saturation by 30%
    blur: 2,            // Apply blur with radius 2
    sharpen: 1.5,       // Apply sharpening
    rotate: 90,         // Rotate 90 degrees
    flip: true,         // Flip horizontally
    grayscale: false    // Keep in color
  },
  '/path/to/edited.jpg',
  false // don't delete original
);
```

### Thumbnail Creation

```typescript
// Create a 300x300 thumbnail
const result = await ImageService.createThumbnail(
  '/path/to/image.jpg',
  300,                    // size (square)
  '/path/to/thumb.webp',  // output path
  85                      // quality
);
```

### Get Image Information

```typescript
const info = await ImageService.getImageInfo('/path/to/image.jpg');
if (info.success) {
  console.log('Width:', info.metadata.width);
  console.log('Height:', info.metadata.height);
  console.log('Format:', info.metadata.format);
  console.log('Color space:', info.metadata.space);
}
```

### Batch Processing

```typescript
// Convert multiple images to WebP
const results = await ImageService.batchProcess(
  ['/path/to/img1.jpg', '/path/to/img2.png', '/path/to/img3.gif'],
  'webp',
  {
    quality: 80,
    resizeWidth: 1000,
    deleteOriginal: false
  }
);

// Create thumbnails for multiple images
const thumbnailResults = await ImageService.batchProcess(
  imagePaths,
  'thumbnail',
  {
    size: 200,
    quality: 75
  }
);
```

## IPC Handlers

The following IPC handlers are available for use in the renderer process:

### Basic Handlers

- `convert-to-webp`: Convert image to WebP (legacy)
- `convert-resize-to-webp`: Convert and resize to WebP (legacy)

### Advanced Handlers

- `convert-to-webp-advanced`: WebP conversion with full options
- `resize-image`: Resize image with custom width
- `manipulate-image`: Apply image manipulations
- `get-image-info`: Get image metadata
- `create-thumbnail`: Create thumbnails
- `batch-process-images`: Process multiple images

### Example IPC Usage (from renderer)

```typescript
// Advanced WebP conversion
const result = await window.electronAPI.invoke('convert-to-webp-advanced', {
  imagePath: '/path/to/image.jpg',
  options: {
    quality: 85,
    resizeWidth: 1200,
    deleteOriginal: true
  }
});

// Image manipulation
const manipResult = await window.electronAPI.invoke('manipulate-image', {
  imagePath: '/path/to/image.jpg',
  manipulations: {
    brightness: 0.1,
    contrast: 0.2,
    blur: 1
  },
  deleteOriginal: false
});

// Batch processing
const batchResult = await window.electronAPI.invoke('batch-process-images', {
  imagePaths: ['/img1.jpg', '/img2.png'],
  operation: 'webp',
  options: { quality: 90, resizeWidth: 800 }
});
```

## Configuration Options

### ImageConversionOptions

```typescript
interface ImageConversionOptions {
  quality?: number;        // WebP quality (1-100), default: 80
  resizeWidth?: number;    // Target width for resizing
  deleteOriginal?: boolean; // Delete original file, default: false
  outputPath?: string;     // Custom output path
}
```

### ImageManipulationOptions

```typescript
interface ImageManipulationOptions {
  brightness?: number;     // Brightness adjustment (-1 to 1)
  contrast?: number;       // Contrast adjustment (-1 to 1)
  saturation?: number;     // Saturation adjustment (-1 to 1)
  blur?: number;          // Blur radius (0.3 to 1000)
  sharpen?: number;       // Sharpen amount (0.5 to 10)
  rotate?: number;        // Rotation angle in degrees
  flip?: boolean;         // Flip horizontally
  flop?: boolean;         // Flip vertically
  grayscale?: boolean;    // Convert to grayscale
}
```

## Return Format

All methods return an `ImageProcessingResult`:

```typescript
interface ImageProcessingResult {
  success: boolean;        // Operation success status
  message: string;         // Success/error message
  outputPath?: string;     // Path to processed image
  originalSize?: number;   // Original file size in bytes
  newSize?: number;        // New file size in bytes
}
```

## Error Handling

All methods include comprehensive error handling and will return a result object with `success: false` and a descriptive error message if something goes wrong.

```typescript
const result = await ImageService.convertToWebP('/invalid/path.jpg');
if (!result.success) {
  console.error('Conversion failed:', result.message);
}
```

## Performance Tips

1. **Batch Processing**: Use `batchProcess()` for multiple images to improve performance
2. **Quality Settings**: Balance quality vs file size (80-90 is usually optimal)
3. **Resize Before Processing**: Resize large images before applying manipulations
4. **WebP Format**: Use WebP for web applications to reduce file sizes significantly
5. **Thumbnail Generation**: Create thumbnails for image galleries to improve loading times

## Supported Formats

**Input formats**: JPEG, PNG, WebP, GIF, TIFF, SVG, AVIF, HEIF
**Output formats**: WebP (primary), JPEG, PNG (via Sharp library)

## Dependencies

- **Sharp**: High-performance image processing library
- **fs/promises**: File system operations
- **path**: Path manipulation utilities