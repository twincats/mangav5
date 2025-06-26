import { IpcMainInvokeEvent } from "electron";

export interface IpcHandler {
  name: string;
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>;
}

export interface IpcModule {
  getHandlers: () => IpcHandler[];
}
