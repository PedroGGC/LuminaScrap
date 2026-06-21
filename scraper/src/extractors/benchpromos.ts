import { BaseExtractor } from "./base";
import * as cheerio from "cheerio";
import { randomDelay } from "../utils/delay";
import { resolveRedirect } from "../utils/resolve-redirect";

export class BenchPromosExtractor extends BaseExtractor {
  name = "Bench Promos";

  async scrape(type: "cpu" | "gpu" | "ram" | "motherboard" | "psu"): Promise<any[]> {
    let category = "processadores";
    if (type === "gpu") {
      category = "placas-de-video";
    } else if (type === "ram") {
      category = "memorias-ram";
    } else if (type === "motherboard") {
      category = "motherboards";
    } else if (type === "psu") {
      category = "fontes";
    }
    const baseUrl = "https://benchpromos.com.br";
    const url = `${baseUrl}/${category}`;

    console.log(`[Bench Promos] Fetching listing page: ${url}...`);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });

    if (res.status !== 200) {
      console.error(`[Bench Promos] Failed to fetch listing page, status: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Find all product detail links
    const detailLinks: { title: string; href: string; image: string }[] = [];
    $("a").each((_, el) => {
      const a = $(el);
      const href = a.attr("href") || "";
      const text = a.text().trim();
      
      // Match card links (e.g. starting with the category slug)
      if (href.startsWith(`/${category}/`) && text.includes("Ver produto")) {
        const titleEl = a.find("h3");
        const title = titleEl.text().trim() || a.find("img").attr("alt")?.trim() || "";
        
        // Image URL: decode from nextjs image optimization if present
        const rawImg = a.find("img").attr("src") || "";
        let image = "";
        if (rawImg.includes("url=")) {
          try {
            const urlParam = new URL(baseUrl + rawImg).searchParams.get("url");
            image = urlParam ? decodeURIComponent(urlParam) : rawImg;
          } catch (e) {
            image = rawImg;
          }
        } else {
          image = rawImg;
        }

        if (href && !detailLinks.some(l => l.href === href)) {
          detailLinks.push({ title, href: baseUrl + href, image });
        }
      }
    });

    console.log(`[Bench Promos] Found ${detailLinks.length} product detail pages to scrape.`);
    const products: any[] = [];

    // Crawl each detail page
    for (const linkObj of detailLinks) {
      console.log(`[Bench Promos] Scraping detail page: ${linkObj.href}...`);
      try {
        const detailRes = await fetch(linkObj.href, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          }
        });

        if (detailRes.status !== 200) {
          console.warn(`[Bench Promos] Failed to fetch details for ${linkObj.title}, status: ${detailRes.status}`);
          continue;
        }

        const detailHtml = await detailRes.text();
        const detail$ = cheerio.load(detailHtml);

        // Find all offer rows/cards. They contain anchors with text "ACESSAR"
        const offers: any[] = [];
        detail$("a").each((_, el) => {
          const a = detail$(el);
          if (a.text().trim() === "ACESSAR") {
            const affiliateUrl = a.attr("href") || "";
            if (!affiliateUrl) return;

            // Traverse up to find the offer container text containing price and store name
            let container = a.parent();
            let containerText = "";
            for (let depth = 0; depth < 5; depth++) {
              const text = container.text().trim().replace(/\s+/g, " ");
              if (text.includes("R$") && (
                text.toLowerCase().includes("amazon") || 
                text.toLowerCase().includes("kabum") || 
                text.toLowerCase().includes("pichau") || 
                text.toLowerCase().includes("terabyte")
              )) {
                containerText = text;
                break;
              }
              container = container.parent();
            }

            if (!containerText) return;

            // Extract prices
            // Remove monthly installment part first, e.g. "10x de R$ 294,17"
            const cleanedText = containerText.replace(/\b\d+x\s+de\s+R\$\s*[\d.]+,\d{2}/gi, "")
                                             .replace(/MELHOR PREÇO/gi, "");
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

            offers.push({
              title: linkObj.title,
              image: linkObj.image,
              priceCash,
              priceInstallment,
              affiliateUrl
            });
          }
        });

        // Resolve affiliate links to get direct URLs
        for (const offer of offers) {
          console.log(`[Bench Promos] Resolving affiliate URL: ${offer.affiliateUrl}...`);
          const resolvedUrl = await resolveRedirect(offer.affiliateUrl);
          
          products.push({
            source: this.name,
            name: offer.title,
            priceCash: offer.priceCash,
            priceInstallment: offer.priceInstallment,
            link: resolvedUrl,
            image: offer.image,
            type
          });
        }

      } catch (err) {
        console.error(`[Bench Promos] Error scraping detail page ${linkObj.href}:`, err);
      }

      await randomDelay(1000, 2000); // Politeness delay
    }

    return products;
  }
}
