import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './api/src/db/*.ts',
  out: './api/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
});