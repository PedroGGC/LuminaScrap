import { BaseExtractor } from "./base";
import * as cheerio from "cheerio";
import { randomDelay } from "../utils/delay";

export class TerabyteExtractor extends BaseExtractor {
  name = "Terabyte";

  async scrape(type: "cpu" | "gpu" | "ram" | "motherboard" | "psu"): Promise<any[]> {
    let category = "processadores";
    if (type === "gpu") {
      category = "placas-de-video";
    } else if (type === "ram") {
      category = "memorias";
    } else if (type === "motherboard") {
      category = "placas-mae";
    } else if (type === "psu") {
      category = "fontes";
    }
    const url = `https://www.terabyteshop.com.br/hardware/${category}`;
    
    // Check if the user requested headful mode
    const headless = process.env.HEADLESS !== "false";
    const browser = await this.getBrowser(headless);
    const page = await this.newPage(browser);

    // Speed up page loading by aborting media resources
    await page.route("**/*", (route) => {
      const resourceType = route.request().resourceType();
      if (["image", "font", "media"].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    const products: any[] = [];

    try {
      console.log(`[Terabyte] Navigating to ${url}...`);
      let loaded = false;
      let attempts = 0;
      while (!loaded && attempts < 2) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
          // Wait a bit for any dynamic content/prices to load
          await page.waitForTimeout(5000);
          loaded = true;
        } catch (err) {
          attempts++;
          if (attempts < 2) {
            console.warn(`[Terabyte] Timeout or block on ${url}. Waiting 5s before retry...`);
            await page.waitForTimeout(5000);
          }
        }
      }

      if (!loaded) {
        throw new Error(`Failed to load Terabyte page ${url} after 2 attempts.`);
      }

      const html = await page.content();
      const $ = cheerio.load(html);

      const items = $(".product-item");
      console.log(`[Terabyte] Found ${items.length} product items.`);

      items.each((_, el) => {
        const item = $(el);
        
        // Grab the title from the 'title' attribute of the name link to avoid truncation
        const nameLink = item.find(".product-item__name");
        const title = nameLink.attr("title")?.trim() || nameLink.find("h2").text().trim() || "";
        const link = nameLink.attr("href")?.trim() || "";

        // Image URL
        const imgEl = item.find(".image-thumbnail");
        const image = imgEl.attr("src") || imgEl.attr("data-src") || "";

        // Prices parsing
        const priceNewText = item.find(".product-item__new-price span").text().trim();
        let priceCash = 0;
        let priceInstallment = 0;

        if (priceNewText) {
          const cleanCash = priceNewText.replace(/[^\d,]/g, "").replace(",", ".");
          priceCash = parseFloat(cleanCash) || 0;
        }

        // Installment parsing from text, e.g. "12x de R$ 77,45"
        const jurosText = item.find(".product-item__juros").text().trim();
        const jurosMatch = jurosText.match(/(\d+)\s*x\s*(?:de\s*)?R\$\s*([\d.]+,\d{2})/i);
        
        if (jurosMatch) {
          const installments = parseInt(jurosMatch[1], 10);
          const installmentVal = parseFloat(jurosMatch[2].replace(/\./g, "").replace(",", "."));
          if (!isNaN(installments) && !isNaN(installmentVal)) {
            priceInstallment = parseFloat((installments * installmentVal).toFixed(2));
          }
        }

        // Fallback for installment price if not parsed or calculation failed
        if (!priceInstallment || priceInstallment < priceCash) {
          const priceOldText = item.find(".product-item__old-price del span").text().trim();
          if (priceOldText) {
            const cleanOld = priceOldText.replace(/[^\d,]/g, "").replace(",", ".");
            priceInstallment = parseFloat(cleanOld) || priceCash;
          } else {
            priceInstallment = priceCash;
          }
        }

        if (title && priceCash > 0) {
          products.push({
            source: this.name,
            name: title,
            priceCash,
            priceInstallment,
            link,
            image,
            type
          });
        }
      });

    } finally {
      await browser.close();
    }

    return products;
  }
}
