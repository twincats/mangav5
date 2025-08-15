import { IpcHandler, IpcModule } from "../types.js";
import sharp from "sharp";
import {
  ImageService,
  ImageConversionOptions,
  ImageManipulationOptions,
} from "../../services/imageService.js";

const genBlue: IpcHandler = {
  name: "generate-blue",
  handler: async (_, msg: string) => {
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .png()
      .toBuffer();
    console.log("create image from sharp: ", msg);
    // return 'from Main : + '+msg;
    return `data:image/png;base64,${buffer.toString("base64")}`;
  },
};

/**
 * Handler to convert any image format to WebP
 * Accepts a path to an image file, saves the converted image with .webp extension,
 * deletes the original file, and returns a success/error status
 */
const convertToWebp: IpcHandler = {
  name: "convert-to-webp",
  handler: async (_, imagePath: string) => {
    const result = await ImageService.convertToWebP(imagePath, {
      quality: 80,
      deleteOriginal: true,
    });

    if (result.success) {
      console.log(
        `Converted ${imagePath} to WebP format and saved to ${result.outputPath}`
      );
    } else {
      console.error(`Error converting image to WebP: ${result.message}`);
    }

    return result;
  },
};

/**
 * Handler to convert any image to WebP and resize to 1000px width while maintaining aspect ratio
 * Accepts a path to an image file, saves the converted image with .webp extension,
 * deletes the original file, and returns a success/error status
 */
const convertAndResizeToWebp: IpcHandler = {
  name: "convert-resize-to-webp",
  handler: async (_, imagePath: string) => {
    const result = await ImageService.convertToWebP(imagePath, {
      quality: 80,
      resizeWidth: 1000,
      deleteOriginal: true,
    });

    if (result.success) {
      console.log(
        `Converted and resized ${imagePath} to WebP format (1000px width) and saved to ${result.outputPath}`
      );
    } else {
      console.error(
        `Error converting and resizing image to WebP: ${result.message}`
      );
    }

    return result;
  },
};

/**
 * Advanced handler for WebP conversion with configurable parameters
 * Accepts an object with imagePath and options
 */
const convertToWebpAdvanced: IpcHandler = {
  name: "convert-to-webp-advanced",
  handler: async (
    _,
    params: { imagePath: string; options?: ImageConversionOptions }
  ) => {
    const { imagePath, options = {} } = params;
    const result = await ImageService.convertToWebP(imagePath, options);

    if (result.success) {
      console.log(
        `Advanced WebP conversion: ${imagePath} -> ${result.outputPath}`
      );
    } else {
      console.error(`Advanced WebP conversion failed: ${result.message}`);
    }

    return result;
  },
};

/**
 * Handler for image resizing with configurable width
 */
const resizeImage: IpcHandler = {
  name: "resize-image",
  handler: async (
    _,
    params: {
      imagePath: string;
      width: number;
      outputPath?: string;
      deleteOriginal?: boolean;
    }
  ) => {
    const { imagePath, width, outputPath, deleteOriginal = false } = params;
    const result = await ImageService.resizeImage(
      imagePath,
      width,
      outputPath,
      deleteOriginal
    );

    if (result.success) {
      console.log(`Image resized: ${imagePath} -> ${result.outputPath}`);
    } else {
      console.error(`Image resize failed: ${result.message}`);
    }

    return result;
  },
};

/**
 * Handler for image manipulation (brightness, contrast, blur, etc.)
 */
const manipulateImage: IpcHandler = {
  name: "manipulate-image",
  handler: async (
    _,
    params: {
      imagePath: string;
      manipulations: ImageManipulationOptions;
      outputPath?: string;
      deleteOriginal?: boolean;
    }
  ) => {
    const {
      imagePath,
      manipulations,
      outputPath,
      deleteOriginal = false,
    } = params;
    const result = await ImageService.manipulateImage(
      imagePath,
      manipulations,
      outputPath,
      deleteOriginal
    );

    if (result.success) {
      console.log(`Image manipulated: ${imagePath} -> ${result.outputPath}`);
    } else {
      console.error(`Image manipulation failed: ${result.message}`);
    }

    return result;
  },
};

/**
 * Handler for getting image metadata
 */
const getImageInfo: IpcHandler = {
  name: "get-image-info",
  handler: async (_, imagePath: string) => {
    const result = await ImageService.getImageInfo(imagePath);

    if (result.success) {
      console.log(`Image info retrieved for: ${imagePath}`);
    } else {
      console.error(`Failed to get image info: ${result.message}`);
    }

    return result;
  },
};

/**
 * Handler for creating thumbnails
 */
const createThumbnail: IpcHandler = {
  name: "create-thumbnail",
  handler: async (
    _,
    params: {
      imagePath: string;
      size?: number;
      outputPath?: string;
      quality?: number;
    }
  ) => {
    const { imagePath, size = 200, outputPath, quality = 80 } = params;
    const result = await ImageService.createThumbnail(
      imagePath,
      size,
      outputPath,
      quality
    );

    if (result.success) {
      console.log(`Thumbnail created: ${imagePath} -> ${result.outputPath}`);
    } else {
      console.error(`Thumbnail creation failed: ${result.message}`);
    }

    return result;
  },
};

/**
 * Handler for batch processing images
 */
const batchProcessImages: IpcHandler = {
  name: "batch-process-images",
  handler: async (
    _,
    params: {
      imagePaths: string[];
      operation: "webp" | "resize" | "thumbnail";
      options?: ImageConversionOptions & { size?: number };
    }
  ) => {
    const { imagePaths, operation, options = {} } = params;
    const results = await ImageService.batchProcess(
      imagePaths,
      operation,
      options
    );

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `Batch processing completed: ${successCount}/${results.length} successful`
    );

    return {
      success: true,
      message: `Batch processing completed: ${successCount}/${results.length} successful`,
      results,
    };
  },
};

export const imageHandlers: IpcModule = {
  getHandlers: () => [
    genBlue,
    convertToWebp,
    convertAndResizeToWebp,
    convertToWebpAdvanced,
    resizeImage,
    manipulateImage,
    getImageInfo,
    createThumbnail,
    batchProcessImages,
  ],
};
