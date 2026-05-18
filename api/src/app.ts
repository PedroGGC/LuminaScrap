import Fastify from 'fastify';
import cors from '@fastify/cors';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { notebooksRouter } from './routes/notebooks.js';
import { pricesRouter } from './routes/prices.js';
import { scrapeRouter } from './routes/scrape.js';

const app = Fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

await app.register(cors, {
  origin: true,
});

await app.register(notebooksRouter);
await app.register(pricesRouter);
await app.register(scrapeRouter);

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const port = parseInt(process.env.PORT || '3001', 10);

app.listen({ port }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

export { app };