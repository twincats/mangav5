import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { InputValidator } from "../utils/validation.js";
import sharp from "sharp";
import {
  ImageService,
  ImageConversionOptions,
  ImageManipulationOptions,
} from "../../services/imageService.js";

const genBlue: IpcHandler<[string], string> = {
  name: "generate-blue",
  handler: async (_, msg: string): IpcResult<string> => {
    // Validate input
    if (!msg || msg.trim().length === 0) {
      return createErrorResponse("Message cannot be empty");
    }

    const sanitizedMsg = InputValidator.sanitizeString(msg);

    try {
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
      
      console.log("create image from sharp: ", sanitizedMsg);
      const result = `data:image/png;base64,${buffer.toString("base64")}`;
      return createSuccessResponse(result, "Blue image generated successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to generate blue image");
    }
  },
  validateInput: (msg: string) => Boolean(msg && msg.trim().length > 0)
};

const convertToWebp: IpcHandler<[string], any> = {
  name: "convert-to-webp",
  handler: async (_, imagePath: string): IpcResult<any> => {
    // Validate input
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    try {
      const result = await ImageService.convertToWebP(imagePath, {
        quality: 80,
        deleteOriginal: true,
      });

      if (result.success) {
        console.log(
          `Converted ${imagePath} to WebP format and saved to ${result.outputPath}`
        );
        return createSuccessResponse(result, "Image converted to WebP successfully");
      } else {
        return createErrorResponse(result.message || "Conversion failed");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to convert image to WebP");
    }
  },
  validateInput: (imagePath: string) => InputValidator.validateFilePath(imagePath)
};

const convertAndResizeToWebp: IpcHandler<[string], any> = {
  name: "convert-resize-to-webp",
  handler: async (_, imagePath: string): IpcResult<any> => {
    // Validate input
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    try {
      const result = await ImageService.convertToWebP(imagePath, {
        quality: 80,
        resizeWidth: 1000,
        deleteOriginal: true,
      });

      if (result.success) {
        console.log(
          `Converted and resized ${imagePath} to WebP format (1000px width) and saved to ${result.outputPath}`
        );
        return createSuccessResponse(result, "Image converted and resized successfully");
      } else {
        return createErrorResponse(result.message || "Conversion and resize failed");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to convert and resize image");
    }
  },
  validateInput: (imagePath: string) => InputValidator.validateFilePath(imagePath)
};

const convertToWebpAdvanced: IpcHandler<[{ imagePath: string; options?: ImageConversionOptions }], any> = {
  name: "convert-to-webp-advanced",
  handler: async (
    _,
    params: { imagePath: string; options?: ImageConversionOptions }
  ): IpcResult<any> => {
    const { imagePath, options = {} } = params;
    
    // Validate input
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    try {
      const result = await ImageService.convertToWebP(imagePath, options);

      if (result.success) {
        console.log(
          `Advanced WebP conversion: ${imagePath} -> ${result.outputPath}`
        );
        return createSuccessResponse(result, "Advanced WebP conversion completed");
      } else {
        return createErrorResponse(result.message || "Advanced conversion failed");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Advanced WebP conversion failed");
    }
  },
  validateInput: (params: { imagePath: string; options?: ImageConversionOptions }) => 
    InputValidator.validateFilePath(params.imagePath)
};

const resizeImage: IpcHandler<[{
  imagePath: string;
  width: number;
  outputPath?: string;
  deleteOriginal?: boolean;
}], any> = {
  name: "resize-image",
  handler: async (
    _,
    params: {
      imagePath: string;
      width: number;
      outputPath?: string;
      deleteOriginal?: boolean;
    }
  ): IpcResult<any> => {
    const { imagePath, width, outputPath, deleteOriginal = false } = params;
    
    // Validate inputs
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    if (width <= 0 || width > 10000) {
      return createErrorResponse("Invalid width value (must be between 1-10000)");
    }

    if (outputPath && !InputValidator.validateFilePath(outputPath)) {
      return createErrorResponse("Invalid output path - access denied");
    }

    try {
      const result = await ImageService.resizeImage(
        imagePath,
        width,
        outputPath,
        deleteOriginal
      );

      if (result.success) {
        console.log(`Image resized: ${imagePath} -> ${result.outputPath}`);
        return createSuccessResponse(result, "Image resized successfully");
      } else {
        return createErrorResponse(result.message || "Image resize failed");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to resize image");
    }
  },
  validateInput: (params: {
    imagePath: string;
    width: number;
    outputPath?: string;
    deleteOriginal?: boolean;
  }) => {
    return InputValidator.validateFilePath(params.imagePath) && 
           params.width > 0 && params.width <= 10000 &&
           (!params.outputPath || InputValidator.validateFilePath(params.outputPath));
  }
};

const manipulateImage: IpcHandler<[{
  imagePath: string;
  manipulations: ImageManipulationOptions;
  outputPath?: string;
  deleteOriginal?: boolean;
}], any> = {
  name: "manipulate-image",
  handler: async (
    _,
    params: {
      imagePath: string;
      manipulations: ImageManipulationOptions;
      outputPath?: string;
      deleteOriginal?: boolean;
    }
  ): IpcResult<any> => {
    const {
      imagePath,
      manipulations,
      outputPath,
      deleteOriginal = false,
    } = params;
    
    // Validate inputs
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    if (outputPath && !InputValidator.validateFilePath(outputPath)) {
      return createErrorResponse("Invalid output path - access denied");
    }

    try {
      const result = await ImageService.manipulateImage(
        imagePath,
        manipulations,
        outputPath,
        deleteOriginal
      );

      if (result.success) {
        console.log(`Image manipulated: ${imagePath} -> ${result.outputPath}`);
        return createSuccessResponse(result, "Image manipulated successfully");
      } else {
        return createErrorResponse(result.message || "Image manipulation failed");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to manipulate image");
    }
  },
  validateInput: (params: {
    imagePath: string;
    manipulations: ImageManipulationOptions;
    outputPath?: string;
    deleteOriginal?: boolean;
  }) => {
    return InputValidator.validateFilePath(params.imagePath) &&
           (!params.outputPath || InputValidator.validateFilePath(params.outputPath));
  }
};

const getImageInfo: IpcHandler<[string], any> = {
  name: "get-image-info",
  handler: async (_, imagePath: string): IpcResult<any> => {
    // Validate input
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    try {
      const result = await ImageService.getImageInfo(imagePath);

      if (result.success) {
        console.log(`Image info retrieved for: ${imagePath}`);
        return createSuccessResponse(result, "Image info retrieved successfully");
      } else {
        return createErrorResponse(result.message || "Failed to get image info");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to get image info");
    }
  },
  validateInput: (imagePath: string) => InputValidator.validateFilePath(imagePath)
};

const createThumbnail: IpcHandler<[{
  imagePath: string;
  size?: number;
  outputPath?: string;
  quality?: number;
}], any> = {
  name: "create-thumbnail",
  handler: async (
    _,
    params: {
      imagePath: string;
      size?: number;
      outputPath?: string;
      quality?: number;
    }
  ): IpcResult<any> => {
    const { imagePath, size = 200, outputPath, quality = 80 } = params;
    
    // Validate inputs
    if (!InputValidator.validateFilePath(imagePath)) {
      return createErrorResponse("Invalid image path - access denied");
    }

    if (size <= 0 || size > 1000) {
      return createErrorResponse("Invalid size value (must be between 1-1000)");
    }

    if (quality < 1 || quality > 100) {
      return createErrorResponse("Invalid quality value (must be between 1-100)");
    }

    if (outputPath && !InputValidator.validateFilePath(outputPath)) {
      return createErrorResponse("Invalid output path - access denied");
    }

    try {
      const result = await ImageService.createThumbnail(
        imagePath,
        size,
        outputPath,
        quality
      );

      if (result.success) {
        console.log(`Thumbnail created: ${imagePath} -> ${result.outputPath}`);
        return createSuccessResponse(result, "Thumbnail created successfully");
      } else {
        return createErrorResponse(result.message || "Thumbnail creation failed");
      }
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to create thumbnail");
    }
  },
  validateInput: (params: {
    imagePath: string;
    size?: number;
    outputPath?: string;
    quality?: number;
  }) => {
    return InputValidator.validateFilePath(params.imagePath) &&
           (!params.size || (params.size > 0 && params.size <= 1000)) &&
           (params.quality === undefined || (params.quality >= 1 && params.quality <= 100)) &&
           (!params.outputPath || InputValidator.validateFilePath(params.outputPath));
  }
};

const batchProcessImages: IpcHandler<[{
  imagePaths: string[];
  operation: "webp" | "resize" | "thumbnail";
  options?: ImageConversionOptions & { size?: number };
}], any> = {
  name: "batch-process-images",
  handler: async (
    _,
    params: {
      imagePaths: string[];
      operation: "webp" | "resize" | "thumbnail";
      options?: ImageConversionOptions & { size?: number };
    }
  ): IpcResult<any> => {
    const { imagePaths, operation, options = {} } = params;
    
    // Validate inputs
    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      return createErrorResponse("Image paths array cannot be empty");
    }

    if (imagePaths.length > 100) {
      return createErrorResponse("Too many images (maximum 100)");
    }

    // Validate all image paths
    for (const imagePath of imagePaths) {
      if (!InputValidator.validateFilePath(imagePath)) {
        return createErrorResponse(`Invalid image path: ${imagePath}`);
      }
    }

    try {
      const results = await ImageService.batchProcess(
        imagePaths,
        operation,
        options
      );

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `Batch processing completed: ${successCount}/${results.length} successful`
      );

      return createSuccessResponse({
        success: true,
        message: `Batch processing completed: ${successCount}/${results.length} successful`,
        results,
      }, `Batch processing completed: ${successCount}/${results.length} successful`);
    } catch (error) {
      return createErrorResponse(error as Error, "Batch processing failed");
    }
  },
  validateInput: (params: {
    imagePaths: string[];
    operation: "webp" | "resize" | "thumbnail";
    options?: ImageConversionOptions & { size?: number };
  }) => {
    return Array.isArray(params.imagePaths) && 
           params.imagePaths.length > 0 && 
           params.imagePaths.length <= 100 &&
           params.imagePaths.every(path => InputValidator.validateFilePath(path));
  }
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
