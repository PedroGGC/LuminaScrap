import { Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { products, notebooks, prices } from '../db/schema.js';
import { eq, desc, and, gte, lte, like, or } from 'drizzle-orm';

export async function notebooksRouter(fastify: FastifyInstance) {
  fastify.get('/notebooks', {
    schema: {
      querystring: Type.Object({
        cpu: Type.Optional(Type.String()),
        gpu: Type.Optional(Type.String()),
        ramMin: Type.Optional(Type.String()),
        ramMax: Type.Optional(Type.String()),
        brand: Type.Optional(Type.String()),
        priceMin: Type.Optional(Type.Number()),
        priceMax: Type.Optional(Type.Number()),
        search: Type.Optional(Type.String()),
        page: Type.Optional(Type.Number({ default: 1 })),
        limit: Type.Optional(Type.Number({ default: 50 })),
        sort: Type.Optional(Type.Enum({ price_asc: 'price_asc', price_desc: 'price_desc', name: 'name' })),
      }),
    },
  }, async (request) => {
    const { cpu, gpu, ramMin, ramMax, brand, priceMin, priceMax, search, page = 1, limit = 50, sort } = request.query as any;

    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (cpu) conditions.push(eq(notebooks.cpu, cpu));
    if (gpu) conditions.push(eq(notebooks.gpu, gpu));
    if (brand) conditions.push(eq(notebooks.marca, brand));
    if (search) conditions.push(like(products.nome, `%${search}%`));

    const priceConditions = [];
    if (priceMin || priceMax) {
      const latestPrices = db.select({
        productId: prices.productId,
        valor: prices.valor,
      })
        .from(prices)
        .orderBy(desc(prices.scrapedAt))
        .prepare('latest_prices');

      // Simple price filtering (would need subquery in production)
    }

    const result = await db
      .select({
        id: products.id,
        nome: products.nome,
        url: products.url,
        site: products.site,
        cpu: notebooks.cpu,
        gpu: notebooks.gpu,
        ram: notebooks.ram,
        storageType: notebooks.storageType,
        storageSize: notebooks.storageSize,
        tela: notebooks.tela,
        marca: notebooks.marca,
        price: prices.valor,
        scrapedAt: prices.scrapedAt,
      })
      .from(products)
      .leftJoin(notebooks, eq(products.id, notebooks.productId))
      .leftJoin(prices, eq(products.id, prices.productId))
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: () => products.id }).from(products);

    return {
      data: result,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
      },
    };
  });

  fastify.get('/notebooks/:id', {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string };

    const result = await db
      .select({
        id: products.id,
        nome: products.nome,
        url: products.url,
        site: products.site,
        cpu: notebooks.cpu,
        gpu: notebooks.gpu,
        ram: notebooks.ram,
        storageType: notebooks.storageType,
        storageSize: notebooks.storageSize,
        tela: notebooks.tela,
        marca: notebooks.marca,
      })
      .from(products)
      .leftJoin(notebooks, eq(products.id, notebooks.productId))
      .where(eq(products.id, id))
      .limit(1);

    if (!result.length) {
      throw { statusCode: 404, message: 'Notebook not found' };
    }

    return result[0];
  });
}