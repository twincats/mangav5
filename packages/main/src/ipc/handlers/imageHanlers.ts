import { IpcHandler, IpcModule } from "../types.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

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
    try {
      // Generate the output path with .webp extension
      const parsedPath = path.parse(imagePath);
      const webpPath = path.join(parsedPath.dir, parsedPath.name + ".webp");

      // Read the image file
      const imageBuffer = await fs.readFile(imagePath);

      // Convert to WebP format
      await sharp(imageBuffer)
        .webp({ quality: 80 }) // 80% quality for good balance between size and quality
        .toFile(webpPath);

      // Delete the original file
      await fs.unlink(imagePath);

      console.log(
        `Converted ${imagePath} to WebP format and saved to ${webpPath}`
      );
      return {
        success: true,
        message: `Image converted successfully to ${webpPath}`,
      };
    } catch (error) {
      console.error(`Error converting image to WebP: ${error}`);
      return {
        success: false,
        message: `Failed to convert image to WebP: ${
          (error as Error).message ?? "Unknown error"
        }`,
      };
    }
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
    try {
      // Generate the output path with .webp extension
      const parsedPath = path.parse(imagePath);
      const webpPath = path.join(parsedPath.dir, parsedPath.name + ".webp");

      // Read the image file
      const imageBuffer = await fs.readFile(imagePath);

      // Convert to WebP format and resize to 1000px width
      await sharp(imageBuffer)
        .resize({ width: 1000, withoutEnlargement: true }) // Resize to 1000px width, maintain aspect ratio
        .webp({ quality: 80 }) // 80% quality for good balance between size and quality
        .toFile(webpPath);

      // Delete the original file
      await fs.unlink(imagePath);

      console.log(
        `Converted and resized ${imagePath} to WebP format (1000px width) and saved to ${webpPath}`
      );
      return {
        success: true,
        message: `Image converted and resized successfully to ${webpPath}`,
      };
    } catch (error) {
      console.error(`Error converting and resizing image to WebP: ${error}`);
      return {
        success: false,
        message: `Failed to convert and resize image to WebP: ${
          (error as Error).message ?? "Unknown error"
        }`,
      };
    }
  },
};

export const imageHandlers: IpcModule = {
  getHandlers: () => [genBlue, convertToWebp, convertAndResizeToWebp],
};
