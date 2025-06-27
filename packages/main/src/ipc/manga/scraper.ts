import { IpcHandler, IpcModule } from "../types.js";
import { scrapTitle, scrapChapter} from '../../services/scraperService.js';

const scraperTitle: IpcHandler = {
  name: "scraper:title",
  handler: async (_, url: string) => {
    return await scrapTitle(url);
  },
};

const scraperChapter: IpcHandler = {
  name: "scraper:chapter",
  handler: async (_, url: string) => {
    return await scrapChapter(url);
  },
};

export const scraperHandlers: IpcModule = {
  getHandlers: () => [scraperTitle,scraperChapter],
};

export interface ScraperRules {
  // Using browser only if need JsSupport
  JsSupport: boolean;
  Pages:{
    ListSelector: string;
    ImagesSelector: string;
    ImageAttribute: string;
  }
}
