import { pgTable, text, timestamp, integer, serial, uuid } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  url: text('url').notNull(),
  site: text('site').notNull(),
  categoria: text('categoria').notNull().default('notebook'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notebooks = pgTable('notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id),
  cpu: text('cpu'),
  gpu: text('gpu'),
  ram: text('ram'),
  storageType: text('storage_type'),
  storageSize: text('storage_size'),
  tela: text('tela'),
  marca: text('marca'),
});

export const prices = pgTable('prices', {
  id: serial('id').primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id),
  valor: integer('valor').notNull(),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
});

export const productGroups = pgTable('product_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scrapeLogs = pgTable('scrape_logs', {
  id: serial('id').primaryKey(),
  site: text('site').notNull(),
  status: text('status').notNull(),
  message: text('message'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  finishedAt: timestamp('finished_at'),
});

export const parseErrors = pgTable('parse_errors', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  error: text('error').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type Notebook = typeof notebooks.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type ProductGroup = typeof productGroups.$inferSelect;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;
export type ParseError = typeof parseErrors.$inferSelect;