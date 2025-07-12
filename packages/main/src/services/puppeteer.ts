import {app, BrowserWindow} from 'electron';
import pie from 'puppeteer-in-electron';
import type {Page} from 'puppeteer-core';
import puppeteerCore from 'puppeteer-core';
import {addExtra} from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

/**
 * Public method to get instance (with default URL).
 */
export async function GetPuppeteerInstance(url="about:blank"): Promise<PuppeteerInstance> {
  // if (puppeteerInstance.page.url() !== url) {
  //   await puppeteerInstance.window.loadURL(url);
  // }
  return await getPuppeteerInstanceInternal(url);
}

/**
 * Actual Puppeteer creation (with required URL).
 */
const getPuppeteerInstanceInternal = createReusableResource<PuppeteerInstance, BrowserWindow, [url: string]>(
  async (url) => {
    const puppeteer = addExtra(puppeteerCore as any);
    puppeteer.use(stealthPlugin());

    const browser = await pie.connect(app, puppeteer as unknown as typeof puppeteerCore);
    const window = new BrowserWindow({ show: false });

    await window.loadURL(url);
    const page = await pie.getPage(browser, window);

    return { page, window };
  },
  (res) => res.destroy(),
  5 * 60 * 1000,
  (res) => res.window
);

/**
 * Auto quit app if all windows are hidden or closed.
 */
app.on('browser-window-created', (_event, window) => {
  window.on('closed', () => {
    const visibleWindowExists = BrowserWindow.getAllWindows().some(w => w.isVisible());
    if (!visibleWindowExists) {
      app.quit();
    }
  });
});

/**
 * Interface for reusable puppeteer instance.
 */
export interface PuppeteerInstance {
  page: Page;
  window: BrowserWindow;
}

type Factory<T, Args extends unknown[] = []> = (...args: Args) => Promise<T> | T;
type Destroyer<D> = (resource: D) => void | Promise<void>;
type Extractor<T, D> = (instance: T) => D;

/**
 * Generic reusable resource creator.
 */
export function createReusableResource<T, D = T, Args extends unknown[] = []>(
  factory: Factory<T, Args>,
  destroyer: Destroyer<D>,
  timeoutMs = 5 * 60 * 1000,
  extractForDestroy?: Extractor<T, D>
): (...args: Args) => Promise<T> {
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

  return async (...args: Args): Promise<T> => {
    if (!instance) {
      instance = await factory(...args);
    }
    resetTimeout();
    return instance;
  };
}

