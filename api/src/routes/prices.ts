import { Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { prices, products } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function pricesRouter(fastify: FastifyInstance) {
  fastify.get('/prices/:productId', {
    schema: {
      params: Type.Object({
        productId: Type.String(),
      }),
    },
  }, async (request) => {
    const { productId } = request.params as { productId: string };

    const history = await db
      .select({
        valor: prices.valor,
        scrapedAt: prices.scrapedAt,
      })
      .from(prices)
      .where(eq(prices.productId, productId))
      .orderBy(desc(prices.scrapedAt));

    return {
      productId,
      history: history.map(h => ({
        price: h.valor / 100,
        scrapedAt: h.scrapedAt,
      })),
    };
  });
}