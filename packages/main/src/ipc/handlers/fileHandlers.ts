import { IpcHandler, IpcModule } from "../types.js";
import fs from "fs/promises";

const readFile: IpcHandler = {
  name: "file:read",
  handler: async (_, path: string) => {
    try {
      return await fs.readFile(path, "utf-8");
    } catch (error) {
      console.error("Error reading file:", error);
      throw error;
    }
  },
};

const writeFile: IpcHandler = {
  name: "file:write",
  handler: async (_, path: string, content: string) => {
    try {
      await fs.writeFile(path, content, "utf-8");
      return true;
    } catch (error) {
      console.error("Error writing file:", error);
      throw error;
    }
  },
};

export const fileHandlers: IpcModule = {
  getHandlers: () => [readFile, writeFile],
};
