import { scrapeKabum } from './kabum/index.js';
import { scrapeMercadoLivre } from './mercadolivre/index.js';
import type { Product } from './types.js';

export interface ScrapeResult {
  source: string;
  status: 'success' | 'error';
  products: Product[];
  error?: string;
}

export async function scrapeAll(): Promise<ScrapeResult[]> {
  const sources = [
    { name: 'kabum', fn: scrapeKabum },
    { name: 'mercadolivre', fn: scrapeMercadoLivre },
  ];

  const results = await Promise.allSettled(
    sources.map(async ({ name, fn }) => {
      const products = await fn();
      return { source: name, status: 'success' as const, products };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      source: sources[index].name,
      status: 'error' as const,
      products: [],
      error: result.reason?.message || 'Unknown error',
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAll().then(results => {
    console.log('\n=== Scrape Results ===');
    results.forEach(r => {
      console.log(`${r.source}: ${r.status} - ${r.products.length} products${r.error ? ` - ${r.error}` : ''}`);
    });
  });
}