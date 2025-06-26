import { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
// import * as Electron from "electron";
// import ipcMain = Electron.ipcMain;
// import sharp from "sharp";
import { registerIpcHandlers } from "../ipc/index.js";

class DataIpcProcess implements AppModule {
  enable({ app }: ModuleContext): Promise<void> | void {
    app.whenReady().then(() => {
      // ipcMain.handle("generate-blue", async (event, msg: string) => {
      //   const buffer = await sharp({
      //     create: {
      //       width: 100,
      //       height: 100,
      //       channels: 3,
      //       background: { r: 0, g: 0, b: 255 },
      //     },
      //   })
      //     .png()
      //     .toBuffer();
      //   console.log("create image from sharp: ", msg);
      //   // return 'from Main : + '+msg;
      //   return `data:image/png;base64,${buffer.toString("base64")}`;
      // });

      // register ipc Handlers
      registerIpcHandlers();
    });
  }
}

export function registerIpcProcess(
  ...args: ConstructorParameters<typeof DataIpcProcess>
) {
  return new DataIpcProcess(...args);
}
