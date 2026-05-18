import { Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import { scrapeAll } from '../../../scrapers/src/index';

export async function scrapeRouter(fastify: FastifyInstance) {
  fastify.post('/scrape', {
    schema: {
      body: Type.Object({
        sources: Type.Optional(Type.Union([
          Type.Array(Type.Union([Type.Literal('kabum'), Type.Literal('mercadolivre')])),
          Type.Literal('all'),
        ])),
      }),
    },
  }, async (request) => {
    const { sources } = request.body as { sources?: string[] | 'all' };

    const jobId = `scrape_${Date.now()}`;

    console.log(`[${jobId}] Starting scrape job...`);

    // For MVP, run synchronously. Future: queue system.
    const results = await scrapeAll();

    const summary = {
      jobId,
      completedAt: new Date().toISOString(),
      results: results.map(r => ({
        source: r.source,
        status: r.status,
        products: r.products.length,
        error: r.error,
      })),
    };

    console.log(`[${jobId}] Complete:`, summary);

    return summary;
  });
}