import { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import {registerMangaProtocol} from '../services/mangaProtocolService.js';
import {protocol} from 'electron'



class MangaProtocol implements AppModule {
  enable({ app }: ModuleContext): Promise<void> | void {
    protocol.registerSchemesAsPrivileged([
      { scheme: 'manga', privileges: { secure: true, standard: true } },
    ]);

    app.whenReady().then(() => {
      registerMangaProtocol();
    });
  }
}

export function registerMangaProtocolModule(
  ...args: ConstructorParameters<typeof MangaProtocol>
) {
  return new MangaProtocol(...args);
}

