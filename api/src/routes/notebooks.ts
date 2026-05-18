import { Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import { db, sql } from '../db/index';
import { products } from '../db/schema';

export async function notebooksRouter(fastify: FastifyInstance) {
  fastify.get('/notebooks', {
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ default: 1 })),
        limit: Type.Optional(Type.Number({ default: 50 })),
      }),
    },
  }, async (request) => {
    const { page = 1, limit = 50 } = request.query as any;
    const limitNum = Number(limit) || 50;
    const offsetNum = (Number(page) - 1) * limitNum;

    console.log('[DEBUG] limit:', limitNum, 'offset:', offsetNum);
    console.log('[DEBUG] db:', !!db, 'sql:', !!sql);

    try {
      // Use raw SQL - drizzle query builder has issues with neon-serverless
      const rawResult = await sql!`SELECT * FROM products LIMIT ${limitNum} OFFSET ${offsetNum}`;
      console.log('[DEBUG] raw SQL result:', rawResult.length);

      const countResult = await sql!`SELECT COUNT(*) as count FROM products`;
      console.log('[DEBUG] count:', countResult);

      return {
        data: rawResult,
        pagination: {
          page,
          limit: limitNum,
          total: Number(countResult[0]?.count) || 0,
        },
      };
    } catch (e: any) {
      console.error('[DEBUG] Error:', e.message);
      throw e;
    }
  });

  fastify.get('/notebooks/:id', {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
  }, async (request) => {
    const { id } = request.params as { id: string };

    const result = await sql!`SELECT * FROM products WHERE id = ${id} LIMIT 1`;

    if (!result.length) {
      throw { statusCode: 404, message: 'Notebook not found' };
    }

    return result[0];
  });
}