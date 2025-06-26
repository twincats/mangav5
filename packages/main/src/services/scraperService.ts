import {BrowserWindow, app} from "electron";
import pie from "puppeteer-in-electron";
import puppeteerCore from "puppeteer-core";
import { addExtra } from 'puppeteer-extra'
import stealthPlugin from 'puppeteer-extra-plugin-stealth';


export async function scrapTitle(url: string): Promise<any> {
  const puppeteer = addExtra(puppeteerCore as any);
  puppeteer.use(stealthPlugin())
  const browser = await pie.connect(app, puppeteer as unknown as typeof puppeteerCore);

  const window = new BrowserWindow({
    show: false,
  });
  await window.loadURL(url);

  const pages = await pie.getPage(browser, window);
  await pages.goto(url, { waitUntil: 'networkidle0' });
  const title = await pages.title();

  // const titles = await pages.$$eval(
  //   '.grid.grid-cols-3.sm\\:grid-cols-3.md\\:grid-cols-3.lg\\:grid-cols-5.gap-4 > .overflow-hidden',
  //   divs => divs.map(div => {
  //     const p = div.querySelector('div.space-y-1 p');
  //     return p?.textContent;
  //   })
  // );

  const titles = await pages.$$eval(
    '.flex.flex-col.items-center.mb-4 > div',
    divs => divs.map(div => {
      const p = div.querySelector('img');
      return p?.getAttribute('src');
    })
  );


  window.destroy();
  return {title:title,list:titles};
}
