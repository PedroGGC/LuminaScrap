import { chromium } from "playwright-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser } from "playwright";

// Initialize the stealth plugin on playwright-extra's chromium wrapper
chromium.use(stealthPlugin());

export interface Extractor {
  name: string;
  scrape(type: "cpu" | "gpu" | "ram" | "motherboard" | "psu", headless?: boolean): Promise<any[]>;
}

export abstract class BaseExtractor implements Extractor {
  abstract name: string;
  abstract scrape(type: "cpu" | "gpu" | "ram" | "motherboard" | "psu", headless?: boolean): Promise<any[]>;

  protected async getBrowser(headless: boolean = true): Promise<Browser> {
    return await chromium.launch({
      headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-blink-features=AutomationControlled"
      ]
    });
  }

  protected async newPage(browser: Browser) {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });
    
    // Add extra headers / scripts if necessary
    const page = await context.newPage();
    return page;
  }
}
