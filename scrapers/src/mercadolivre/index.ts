import { fetchWithRetry, ScrapeError } from '../shared/request.js';
import { type Product } from '../types.js';

const ML_API_BASE = 'https://api.mercadolibre.com';
const ML_SITE = 'MLB';
const ML_CATEGORY = 'MLB1652'; // Notebooks

interface MLItem {
  id: string;
  title: string;
  permalink: string;
  thumbnail: string;
  price: number;
  currency_id: string;
}

interface MLSearchResponse {
  results: MLItem[];
}

export async function scrapeMercadoLivre(): Promise<Product[]> {
  console.log('[Mercado Livre] Starting scrape...');

  try {
    const url = `${ML_API_BASE}/sites/${ML_SITE}/search?category=${ML_CATEGORY}&limit=50`;
    const response = await fetchWithRetry(url, {
      timeout: 30000,
      retries: 2,
    });

    if (!response.ok) {
      throw new ScrapeError(`ML API failed: ${response.status}`, response.status, true);
    }

    const data: MLSearchResponse = await response.json();

    if (!data.results?.length) {
      console.warn('[ML] No products found');
      return [];
    }

    const products: Product[] = data.results.map((item: MLItem) => ({
      id: item.id,
      nome: item.title,
      url: item.permalink,
      site: 'mercadolivre',
      price: Math.floor(item.price * 100),
      image: item.thumbnail,
    }));

    console.log(`[ML] Scraped ${products.length} products`);
    return products;
  } catch (error) {
    console.error('[ML] Scrape failed:', error);
    throw error;
  }
}