import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL not set');
}

const sql = connectionString ? neon(connectionString) : null;
const db = sql ? drizzle(sql, { schema }) : null;

export { db, sql };

export type Database = typeof db;