import { IpcHandler, IpcModule } from "../types.js";
import { scrapTitle} from '../../services/scraperService.js';

const scraperTitle: IpcHandler = {
  name: "scraper:title",
  handler: async (_, url: string) => {
    return await scrapTitle(url);
  },
};

export const scraperHandlers: IpcModule = {
  getHandlers: () => [scraperTitle],
};
