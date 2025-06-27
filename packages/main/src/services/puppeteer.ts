import {app, BrowserWindow} from 'electron';
import pie from 'puppeteer-in-electron';
import type {Page} from 'puppeteer-core';
import puppeteerCore from 'puppeteer-core';
import {addExtra} from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';


export async function GetPuppeteerInstance(url="about:blank"): Promise<PuppeteerInstance> {
  // if (puppeteerInstance.page.url() !== url) {
  //   await puppeteerInstance.window.loadURL(url);
  // }
  return await getPuppeteerInstanceInternal();
}

const getPuppeteerInstanceInternal = createReusableResource<PuppeteerInstance, BrowserWindow>(
  async () => {
    const puppeteer = addExtra(puppeteerCore as any);
    puppeteer.use(stealthPlugin());

    const browser = await pie.connect(app, puppeteer as unknown as typeof puppeteerCore);
    const window = new BrowserWindow({ show: false });

    await window.loadURL("about:blank");
    const page = await pie.getPage(browser, window);

    return { page, window };
  },
  (res) => res.destroy(),
  5 * 60 * 1000,
  (res) => res.window
);

export interface PuppeteerInstance {
  page: Page;
  window: BrowserWindow;
}

type Factory<T> = () => Promise<T> | T;
type Destroyer<D> = (resource: D) => void | Promise<void>;
type Extractor<T, D> = (instance: T) => D;

export function createReusableResource<T, D = T>(
  factory: Factory<T>,
  destroyer: Destroyer<D>,
  timeoutMs = 5 * 60 * 1000,
  extractForDestroy?: Extractor<T, D>
): () => Promise<T> {
  let instance: T | null = null;
  let timeout: NodeJS.Timeout | null = null;

  const resetTimeout = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(async () => {
      if (instance) {
        const resource = extractForDestroy ? extractForDestroy(instance) : (instance as unknown as D);
        await destroyer(resource);
        instance = null;
      }
    }, timeoutMs);
  };

  return async (): Promise<T> => {
    if (!instance) {
      instance = await factory();
    }
    resetTimeout();
    return instance;
  };
}

