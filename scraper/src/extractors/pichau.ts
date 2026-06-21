import { BaseExtractor } from "./base";
import { randomDelay } from "../utils/delay";

export class PichauExtractor extends BaseExtractor {
  name = "Pichau";

  async scrape(type: "cpu" | "gpu" | "ram" | "motherboard" | "psu"): Promise<any[]> {
    let category = "processadores";
    if (type === "gpu") {
      category = "placa-de-video";
    } else if (type === "ram") {
      category = "memorias";
    } else if (type === "motherboard") {
      category = "placas-mae";
    } else if (type === "psu") {
      category = "fontes";
    }
    
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
    let currentPage = 1;
    let keepCrawling = true;

    try {
      while (keepCrawling) {
        const url = `https://www.pichau.com.br/hardware/${category}?page=${currentPage}`;
        console.log(`[Pichau] Navigating to page ${currentPage}...`);
        
        let loaded = false;
        let attempts = 0;
        while (!loaded && attempts < 2) {
          try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
            await page.waitForSelector('a[data-cy="list-product"]', { timeout: 15000 });
            loaded = true;
          } catch (err) {
            attempts++;
            if (attempts < 2) {
              console.warn(`[Pichau] Timeout or block on page ${currentPage}. Waiting 5s before retry...`);
              await page.waitForTimeout(5000);
            }
          }
        }

        if (!loaded) {
          console.warn(`[Pichau] Failed to load page ${currentPage} after 2 attempts. Stopping.`);
          break;
        }

        const pageProducts = await page.$$eval('a[data-cy="list-product"]', (cards) => {
          return cards.map((card) => {
            const titleEl = card.querySelector("h2");
            const imgEl = card.querySelector("img");
            return {
              name: titleEl ? titleEl.textContent?.trim() || "" : "",
              link: (card as HTMLAnchorElement).href || "",
              image: imgEl ? imgEl.src || imgEl.getAttribute("src") || "" : "",
              fullText: card.textContent || ""
            };
          });
        });

        if (pageProducts.length === 0) {
          console.log(`[Pichau] No products found on page ${currentPage}. Stopping.`);
          break;
        }

        // Process and parse extracted products
        for (const raw of pageProducts) {
          if (!raw.name) continue;

          // Exclude monthly installment pricing (e.g. 10x de R$ 94,11) before extracting standard prices
          const cleanedText = raw.fullText.replace(/\b\d+x\s+de\s+R\$\s*[\d.]+,\d{2}/gi, "");
          const priceMatches = [...cleanedText.matchAll(/R\$\s*([\d.]+,\d{2})/g)].map(m => m[1]);
          const prices = priceMatches.map(m => {
            const clean = m.replace(/\./g, "").replace(",", ".");
            return parseFloat(clean);
          }).filter(p => !isNaN(p) && p > 0);

          let priceCash = 0;
          let priceInstallment = 0;

          if (prices.length > 0) {
            prices.sort((a, b) => a - b);
            priceCash = prices[0];
            priceInstallment = prices[prices.length - 1];
          }

          products.push({
            source: this.name,
            name: raw.name,
            priceCash,
            priceInstallment,
            link: raw.link,
            image: raw.image,
            type
          });
        }

        console.log(`[Pichau] Extracted ${pageProducts.length} items from page ${currentPage}.`);
        
        if (currentPage >= 3) {
          console.log(`[Pichau] Reached page cap of 3. Stopping.`);
          break;
        }

        currentPage++;
        await randomDelay(1500, 3000);
      }
    } finally {
      await browser.close();
    }

    return products;
  }
}
