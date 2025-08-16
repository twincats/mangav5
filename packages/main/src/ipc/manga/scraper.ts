import { IpcHandler, IpcModule, IpcResult } from "../types.js";
import { createSuccessResponse, createErrorResponse } from "../utils/errorHandler.js";
import { InputValidator } from "../utils/validation.js";
import { scrapTitle, scrapChapter} from '../../services/scraperService.js';
import type { PuppeteerLifeCycleEvent } from 'puppeteer-core';

const scraperTitle: IpcHandler<[string], any> = {
  name: "scraper:title",
  handler: async (_, url: string): IpcResult<any> => {
    // Validate URL
    if (!InputValidator.validateUrl(url)) {
      return createErrorResponse("Invalid URL format - only HTTP/HTTPS allowed");
    }

    try {
      const result = await scrapTitle(url);
      return createSuccessResponse(result, "Title scraped successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to scrape title");
    }
  },
  validateInput: (url: string) => InputValidator.validateUrl(url)
};

const scraperChapter: IpcHandler<[string], any> = {
  name: "scraper:chapter",
  handler: async (_, url: string): IpcResult<any> => {
    // Validate URL
    if (!InputValidator.validateUrl(url)) {
      return createErrorResponse("Invalid URL format - only HTTP/HTTPS allowed");
    }

    try {
      const result = await scrapChapter(url);
      return createSuccessResponse(result, "Chapter scraped successfully");
    } catch (error) {
      return createErrorResponse(error as Error, "Failed to scrape chapter");
    }
  },
  validateInput: (url: string) => InputValidator.validateUrl(url)
};

export const scraperHandlers: IpcModule = {
  getHandlers: () => [scraperTitle, scraperChapter],
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
