import { IpcMainInvokeEvent } from "electron";
import { IpcResponse, IpcResult } from "./utils/errorHandler.js";

export interface IpcHandler<TArgs extends any[] = any[], TReturn = any> {
  name: string;
  handler: (event: IpcMainInvokeEvent, ...args: TArgs) => IpcResult<TReturn>;
  validateInput?: (...args: TArgs) => boolean;
}

export interface IpcModule {
  getHandlers: () => IpcHandler[];
}

// Re-export types for convenience
export type { IpcResponse, IpcResult, IpcSuccess, IpcError } from "./utils/errorHandler.js";
