import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export interface ImageConversionOptions {
  quality?: number; // WebP quality (1-100)
  resizeWidth?: number; // Target width for resizing
  deleteOriginal?: boolean; // Whether to delete the original file
  outputPath?: string; // Custom output path
}

export interface ImageManipulationOptions {
  brightness?: number; // Brightness adjustment (-1 to 1)
  contrast?: number; // Contrast adjustment (-1 to 1)
  saturation?: number; // Saturation adjustment (-1 to 1)
  blur?: number; // Blur radius (0.3 to 1000)
  sharpen?: number; // Sharpen amount (0.5 to 10)
  rotate?: number; // Rotation angle in degrees
  flip?: boolean; // Flip horizontally
  flop?: boolean; // Flip vertically
  grayscale?: boolean; // Convert to grayscale
}

export interface ImageProcessingResult {
  success: boolean;
  message: string;
  outputPath?: string;
  originalSize?: number;
  newSize?: number;
}

export class ImageService {
  /**
   * Convert image to WebP format with optional resizing
   */
  static async convertToWebP(
    inputPath: string,
    options: ImageConversionOptions = {}
  ): Promise<ImageProcessingResult> {
    try {
      const {
        quality = 80,
        resizeWidth,
        deleteOriginal = false,
        outputPath
      } = options;

      // Validate input file exists
      await fs.access(inputPath);

      // Generate output path
      const parsedPath = path.parse(inputPath);
      const webpPath = outputPath || path.join(parsedPath.dir, parsedPath.name + ".webp");

      // Get original file size
      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      // Read and process image
      const imageBuffer = await fs.readFile(inputPath);
      let sharpInstance = sharp(imageBuffer);

      // Apply resizing if specified
      if (resizeWidth && resizeWidth > 0) {
        sharpInstance = sharpInstance.resize({
          width: resizeWidth,
          withoutEnlargement: true // Don't enlarge smaller images
        });
      }

      // Convert to WebP
      await sharpInstance
        .webp({ quality: Math.max(1, Math.min(100, quality)) })
        .toFile(webpPath);

      // Get new file size
      const newStats = await fs.stat(webpPath);
      const newSize = newStats.size;

      // Delete original if requested
      if (deleteOriginal) {
        await fs.unlink(inputPath);
      }

      return {
        success: true,
        message: `Image converted successfully to ${webpPath}`,
        outputPath: webpPath,
        originalSize,
        newSize
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to convert image: ${(error as Error).message}`
      };
    }
  }

  /**
   * Resize image while maintaining aspect ratio
   */
  static async resizeImage(
    inputPath: string,
    width: number,
    outputPath?: string,
    deleteOriginal = false
  ): Promise<ImageProcessingResult> {
    try {
      await fs.access(inputPath);

      const parsedPath = path.parse(inputPath);
      const resizedPath = outputPath || path.join(
        parsedPath.dir,
        `${parsedPath.name}_resized${parsedPath.ext}`
      );

      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      await sharp(inputPath)
        .resize({
          width: Math.max(1, width),
          withoutEnlargement: true
        })
        .toFile(resizedPath);

      const newStats = await fs.stat(resizedPath);
      const newSize = newStats.size;

      if (deleteOriginal) {
        await fs.unlink(inputPath);
      }

      return {
        success: true,
        message: `Image resized successfully to ${resizedPath}`,
        outputPath: resizedPath,
        originalSize,
        newSize
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to resize image: ${(error as Error).message}`
      };
    }
  }

  /**
   * Apply image manipulations (brightness, contrast, blur, etc.)
   */
  static async manipulateImage(
    inputPath: string,
    manipulations: ImageManipulationOptions,
    outputPath?: string,
    deleteOriginal = false
  ): Promise<ImageProcessingResult> {
    try {
      await fs.access(inputPath);

      const parsedPath = path.parse(inputPath);
      const manipulatedPath = outputPath || path.join(
        parsedPath.dir,
        `${parsedPath.name}_edited${parsedPath.ext}`
      );

      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      let sharpInstance = sharp(inputPath);

      // Apply transformations
      if (manipulations.rotate) {
        sharpInstance = sharpInstance.rotate(manipulations.rotate);
      }

      if (manipulations.flip) {
        sharpInstance = sharpInstance.flip();
      }

      if (manipulations.flop) {
        sharpInstance = sharpInstance.flop();
      }

      if (manipulations.grayscale) {
        sharpInstance = sharpInstance.grayscale();
      }

      // Apply image adjustments
      const modulate: any = {};
      if (manipulations.brightness !== undefined) {
        modulate.brightness = Math.max(0, 1 + manipulations.brightness);
      }
      if (manipulations.saturation !== undefined) {
        modulate.saturation = Math.max(0, 1 + manipulations.saturation);
      }

      if (Object.keys(modulate).length > 0) {
        sharpInstance = sharpInstance.modulate(modulate);
      }

      // Apply blur
      if (manipulations.blur && manipulations.blur > 0) {
        sharpInstance = sharpInstance.blur(Math.max(0.3, Math.min(1000, manipulations.blur)));
      }

      // Apply sharpen
      if (manipulations.sharpen && manipulations.sharpen > 0) {
        sharpInstance = sharpInstance.sharpen(Math.max(0.5, Math.min(10, manipulations.sharpen)));
      }

      // Apply contrast (using linear adjustment)
      if (manipulations.contrast !== undefined) {
        const contrastValue = Math.max(0.1, 1 + manipulations.contrast);
        sharpInstance = sharpInstance.linear(contrastValue, 0);
      }

      await sharpInstance.toFile(manipulatedPath);

      const newStats = await fs.stat(manipulatedPath);
      const newSize = newStats.size;

      if (deleteOriginal) {
        await fs.unlink(inputPath);
      }

      return {
        success: true,
        message: `Image manipulated successfully to ${manipulatedPath}`,
        outputPath: manipulatedPath,
        originalSize,
        newSize
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to manipulate image: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get image metadata
   */
  static async getImageInfo(imagePath: string): Promise<{
    success: boolean;
    metadata?: sharp.Metadata;
    message?: string;
  }> {
    try {
      await fs.access(imagePath);
      const metadata = await sharp(imagePath).metadata();
      return {
        success: true,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get image info: ${(error as Error).message}`
      };
    }
  }

  /**
   * Create thumbnail from image
   */
  static async createThumbnail(
    inputPath: string,
    size = 200,
    outputPath?: string,
    quality = 80
  ): Promise<ImageProcessingResult> {
    try {
      await fs.access(inputPath);

      const parsedPath = path.parse(inputPath);
      const thumbnailPath = outputPath || path.join(
        parsedPath.dir,
        `${parsedPath.name}_thumb.webp`
      );

      const originalStats = await fs.stat(inputPath);
      const originalSize = originalStats.size;

      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality })
        .toFile(thumbnailPath);

      const newStats = await fs.stat(thumbnailPath);
      const newSize = newStats.size;

      return {
        success: true,
        message: `Thumbnail created successfully at ${thumbnailPath}`,
        outputPath: thumbnailPath,
        originalSize,
        newSize
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create thumbnail: ${(error as Error).message}`
      };
    }
  }

  /**
   * Batch process multiple images
   */
  static async batchProcess(
    inputPaths: string[],
    operation: 'webp' | 'resize' | 'thumbnail',
    options: ImageConversionOptions & { size?: number } = {}
  ): Promise<ImageProcessingResult[]> {
    const results: ImageProcessingResult[] = [];

    for (const inputPath of inputPaths) {
      try {
        let result: ImageProcessingResult;

        switch (operation) {
          case 'webp':
            result = await this.convertToWebP(inputPath, options);
            break;
          case 'resize':
            result = await this.resizeImage(
              inputPath,
              options.resizeWidth || 1000,
              options.outputPath,
              options.deleteOriginal
            );
            break;
          case 'thumbnail':
            result = await this.createThumbnail(
              inputPath,
              options.size || 200,
              options.outputPath,
              options.quality
            );
            break;
          default:
            result = {
              success: false,
              message: `Unknown operation: ${operation}`
            };
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          message: `Failed to process ${inputPath}: ${(error as Error).message}`
        });
      }
    }

    return results;
  }
}

export default ImageService;