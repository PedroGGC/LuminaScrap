import { BaseExtractor } from "./base";
import { randomDelay } from "../utils/delay";

export class KabumExtractor extends BaseExtractor {
  name = "KaBuM!";

  async scrape(type: "cpu" | "gpu" | "ram" | "motherboard" | "psu"): Promise<any[]> {
    let category = "hardware/processadores";
    if (type === "gpu") {
      category = "hardware/placa-de-video-vga";
    } else if (type === "ram") {
      category = "hardware/memoria-ram";
    } else if (type === "motherboard") {
      category = "hardware/placas-mae";
    } else if (type === "psu") {
      category = "hardware/fontes";
    }
    const products: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    console.log(`[KaBuM!] Scraping ${type.toUpperCase()}s from KaBuM! using direct API client...`);

    while (currentPage <= totalPages) {
      console.log(`[KaBuM!] Fetching page ${currentPage} of ${totalPages}...`);
      let success = false;

      // Primary strategy: Direct API Fetch (Extremely fast, zero browser overhead, no CAPTCHA blocks)
      try {
        const apiUrl = `https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products-by-category/${category}?page_number=${currentPage}&page_size=100&facet_filters=&sort=most_searched&is_prime=false&payload_data=products_category_filters&include=gift`;
        const apiRes = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          }
        });

        if (apiRes.status === 200) {
          const directData = await apiRes.json();
          if (directData && directData.data) {
            if (directData.meta && directData.meta.total_pages_count) {
              totalPages = directData.meta.total_pages_count;
            }
            const pageProducts = directData.data.map((item: any) => {
              const photos = item.attributes?.photos;
              const imgUrl = photos?.g?.[0] || photos?.m?.[0] || photos?.p?.[0] || "";
              return {
                source: this.name,
                name: item.attributes?.title || "",
                priceCash: item.attributes?.price_with_discount ?? item.attributes?.price ?? 0,
                priceInstallment: item.attributes?.price ?? 0,
                link: `https://www.kabum.com.br/produto/${item.id}/${item.attributes?.product_link || ""}`,
                image: imgUrl,
                type
              };
            });
            products.push(...pageProducts);
            console.log(`[KaBuM!] Direct API: Extracted ${pageProducts.length} items from page ${currentPage}.`);
            success = true;
          }
        }
      } catch (err) {
        console.warn(`[KaBuM!] Direct API request failed for page ${currentPage}:`, err);
      }

      // Secondary fallback strategy: Playwright Browser & Network Interception
      if (!success) {
        console.log(`[KaBuM!] Direct API failed or blocked. Falling back to Playwright browser interception...`);
        const browser = await this.getBrowser(true);
        const page = await this.newPage(browser);

        try {
          await page.route("**/*", (route) => {
            const resourceType = route.request().resourceType();
            if (["image", "font", "stylesheet", "media"].includes(resourceType)) {
              route.abort();
            } else {
              route.continue();
            }
          });

          let pageData: any = null;
          const responseHandler = async (res: any) => {
            const url = res.url();
            if (url.includes("products-by-category") && url.includes(`page_number=${currentPage}`)) {
              try {
                pageData = await res.json();
              } catch (e) {}
            }
          };

          page.on("response", responseHandler);
          const url = `https://www.kabum.com.br/${category}?page_number=${currentPage}&page_size=100&sort=most_searched`;
          
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
          for (let i = 0; i < 10; i++) {
            if (pageData) break;
            await page.waitForTimeout(500);
          }

          page.off("response", responseHandler);

          if (pageData && pageData.data) {
            if (pageData.meta && pageData.meta.total_pages_count) {
              totalPages = pageData.meta.total_pages_count;
            }
            const pageProducts = pageData.data.map((item: any) => {
              const photos = item.attributes?.photos;
              const imgUrl = photos?.g?.[0] || photos?.m?.[0] || photos?.p?.[0] || "";
              return {
                source: this.name,
                name: item.attributes?.title || "",
                priceCash: item.attributes?.price_with_discount ?? item.attributes?.price ?? 0,
                priceInstallment: item.attributes?.price ?? 0,
                link: `https://www.kabum.com.br/produto/${item.id}/${item.attributes?.product_link || ""}`,
                image: imgUrl,
                type
              };
            });
            products.push(...pageProducts);
            console.log(`[KaBuM!] Playwright Intercept: Extracted ${pageProducts.length} items from page ${currentPage}.`);
          } else {
            console.error(`[KaBuM!] Browser interception failed to capture page ${currentPage} data.`);
          }
        } catch (err) {
          console.error(`[KaBuM!] Playwright fallback failed for page ${currentPage}:`, err);
        } finally {
          await browser.close();
        }
      }

      // Cap at 3 pages to prevent excessive requests for dev/verification
      if (currentPage >= 3) {
        console.log(`[KaBuM!] Reached max development page cap of 3. Stopping.`);
        break;
      }

      currentPage++;
      await randomDelay(1000, 2000);
    }

    return products;
  }
}
