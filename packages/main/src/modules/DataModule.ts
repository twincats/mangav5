import { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import { registerContextMenu, registerIpcHandlers } from "../ipc/index.js";

class DataIpcProcess implements AppModule {
  enable({ app }: ModuleContext): Promise<void> {
    return app.whenReady().then(async () => {
      // register ipc Handlers
      await registerIpcHandlers();
      await registerContextMenu();
      console.log('IPC handlers registered successfully');
    });
  }
}

export function registerIpcProcess(
  ...args: ConstructorParameters<typeof DataIpcProcess>
) {
  return new DataIpcProcess(...args);
}
