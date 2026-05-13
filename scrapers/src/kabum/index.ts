import { fetchWithRetry, ScrapeError } from '../shared/request.js';
import { ProductSchema, type Product } from '../types.js';

const KABUM_API_BASE = 'https://www.kabum.com.br/api/v1';
const KABUM_SEARCH_URL = `${KABUM_API_BASE}/layout?Object=3&Position=1&Page=1&Limit=20&Sort=most_recent&Tag=849&Category=108`;

interface KabumProduct {
  productId: number;
  name: string;
  url: string;
  image: string;
  price: number;
  currency: string;
}

export async function scrapeKabum(): Promise<Product[]> {
  console.log('[Kabum] Starting scrape...');

  try {
    const response = await fetchWithRetry(KABUM_SEARCH_URL, {
      timeout: 30000,
      retries: 2,
    });

    if (!response.ok) {
      throw new ScrapeError(`Kabum API failed: ${response.status}`, response.status, true);
    }

    const data = await response.json();

    if (!data?.data?.products) {
      console.warn('[Kabum] No products found in response');
      return [];
    }

    const products: Product[] = data.data.products.map((p: KabumProduct) => ({
      id: String(p.productId),
      nome: p.name,
      url: `https://www.kabum.com.br${p.url}`,
      site: 'kabum',
      price: Math.floor(p.price * 100),
      image: p.image,
    }));

    console.log(`[Kabum] Scraped ${products.length} products`);
    return products;
  } catch (error) {
    console.error('[Kabum] Scrape failed:', error);
    throw error;
  }
}