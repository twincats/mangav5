import { IpcHandler, IpcModule } from "../types.js";
import { scrapTitle, scrapChapter} from '../../services/scraperService.js';
import type { PuppeteerLifeCycleEvent } from 'puppeteer-core';

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
  WaitUntil: PuppeteerLifeCycleEvent
  Pages:{
    ListSelector: string;
    ImagesSelector: string;
    ImageAttribute: string;
  }
  Chapter :{
    MangaTitleSelector:string;
    CoverImageSelector:string;
    CoverImageAttribute:string;
    ChapterListSelector:string;
    ChapterListIdSelector:string;
    ChapterListIdAttribute?:string;
    ChapterListChapterSelector:string;
    ChapterListChapterAttribute?:string;
    ChapterListTimestampSelector:string;
    ChapterListTimestampAttribute?:string;
    ChapterListTitleSelector?:string;
    ChapterListTitleAttribute?:string;
    ChapterListGroupName:string;
    ChapterListLanguage:'English'|'Indonesia';
  }
}
