import {GetPuppeteerInstance} from './puppeteer.js'


export async function scrapTitle(url: string): Promise<any> {

  const puppeteer = await GetPuppeteerInstance(url);
  const pages = puppeteer.page

  await pages.goto(url, { waitUntil: 'networkidle2' });
  const title = await pages.title();

  const titles = await pages.$$eval(
    '.flex.flex-col.items-center.mb-4 > div',
    divs => divs.map(div => {
      const p = div.querySelector('img');
      return p?.getAttribute('src');
    })
  );

  return {title:title,list:titles};
}

export async function scrapChapter(url:string){
  const puppeteer = await GetPuppeteerInstance();
  const pages = puppeteer.page

  await pages.goto(url, { waitUntil: 'networkidle2' });
  const mangaTitle = await pages.$eval('div[data-slot="card-title"]', el => el.textContent?.trim()|| '');
  const cover = await pages.$eval('img[alt="Comic Cover"]',el=>el.getAttribute('src'))
  const chapters = await pages.$$eval('div[style="max-height: 480px; overflow: auto;"] > div',divs=>divs.map(
    div=>{
     const chap = div.querySelector('p')?.textContent?.trim();
     const id = div.querySelector('a')?.getAttribute('href');
     const timestamp = div.querySelector('p.text-muted-foreground')?.textContent?.trim();
     return {id,chap,timestamp}
    }
  ))
  // const mangaTitle = await pages.$eval('div[data-slot="card-title"]', el => el.textContent?.trim()|| '');
  return {mangaTitle:mangaTitle,cover:cover,chapters:chapters};
}
