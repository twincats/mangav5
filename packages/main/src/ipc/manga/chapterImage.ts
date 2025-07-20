import { IpcHandler, IpcModule } from "../types.js";
import {getImageList, clearZipCache} from '../../services/mangaProtocolService.js';


const chapterImageGetImageList: IpcHandler = {
  name: "chapterImage:getImageList",
  handler: async (_, chapterPath: string):Promise<string[]> => {
    return await getImageList(chapterPath);
  },
};

const chapterImageClearZipCache: IpcHandler = {
  name: "chapterImage:clearZipCache",
  handler: async (_, url: string) => {
    clearZipCache()
  },
};

export const chapterImageHandlers: IpcModule = {
  getHandlers: () => [chapterImageGetImageList,chapterImageClearZipCache],
};
