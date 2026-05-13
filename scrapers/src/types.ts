import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  nome: z.string(),
  url: z.string(),
  site: z.string(),
  price: z.number(),
  image: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const ScrapedProduct = ProductSchema.extend({
  scrapedAt: z.date(),
});

export type ScrapedProduct = z.infer<typeof ScrapedProduct>;