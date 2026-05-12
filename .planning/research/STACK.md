# Technology Stack — Painel de Preços de Notebooks (Brasil)

**Project:** Painel de Preços de Notebooks — Web Scraper + Painel
**Researched:** 2025-05-12
**Overall Confidence:** HIGH

---

## Recommended Stack

### Core Languages & Runtimes

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js** | 22 LTS | Runtime for scraper + API | LTS as of May 2026. Built-in `fetch`, native test runner. Suporta `--experimental-strip-types` (TS sem `ts-node`) |
| **TypeScript** | 5.x | Language | Tipo seguro em toda a stack: schema → scraper → API → frontend |
| **pnpm** | 9.x | Package manager | Mais rápido que npm, lockfile determinístico, workspace support para monorepo futuro |

### Scraper Layer — GitHub Actions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Cheerio** | 1.2.0 | Parse de HTML estático | Terabyte, Magalu (páginas server-rendered). ~11KB gzip. API jQuery-like familiar. Usar com `fetch()` nativo do Node 22 |
| **Playwright** | 1.60.0 | Browser automation para sites com JS/anti-bot | **Substitui Puppeteer recomendado no doc original.** Razões abaixo. |
| **Zod** | 4.4.3 | Validação de dados scrapeados antes de inserir no banco | Zero deps, tipo seguro, drizzle-zod 0.8.3 tem compatibilidade explícita com Zod v4 |
| **node-fetch** (nativo) | — | HTTP requests para APIs (Kabum, ML, Pichau) | Node 22 já tem `fetch` global. Sem dep extra. |

#### Por que Playwright em vez de Puppeteer?

| Critério | Playwright 1.60.0 | Puppeteer 24.43.1 |
|----------|-------------------|-------------------|
| **Anti-detection baseline** | Built-in cross-browser context isolation | Precisa de `puppeteer-extra-plugin-stealth` 2.11.2 (3 ANOS sem updates — última pub 2022) |
| **GitHub Actions** | Action oficial `@playwright/test@v1` — instala browsers + deps | Precisa configurar Chromium manualmente no container |
| **Stealth ecosystem** | `playwright-extra` (mesmo autor) + patches manuais | Stealth plugin 2.11.2 — 3 anos parado. Evasões desatualizadas p/ Cloudflare moderno |
| **Browser variety** | Chromium + Firefox + WebKit | Só Chromium |
| **Ease of use** | API mais limpa, auto-waiting nativo | `.waitForSelector()` manual |

**Conclusão:** Puppeteer + stealth plugin é um risco alto. O stealth plugin foi publicado pela última vez em 2022 e o Puppeteer saltou para v24. Sites brasileiros como Americanas e Magalu usam Cloudflare, que detecta headless Chrome antigo com facilidade. Playwright é a escolha mais segura para 2025-2026.

**Exceção:** Se precisar de `puppeteer-extra-plugin-stealth` especificamente (ex.: Pichau API interna requer fingerprint específico), use `puppeteer@22` (última versão antes do salto v23/v24, compatível com o plugin) em vez de Puppeteer 24.

### API Layer — Fastify

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Fastify** | 5.8.5 | HTTP framework | 2-3x mais rápido que Express, JSON Schema validation nativo, serialization otimizada. v5 estável |
| **@scalar/fastify-api-reference** | 1.55.3 | Docs interativas dos endpoints | Substitui Swagger UI. Mais bonito, zero config, dark mode, born in 2025 |
| **@fastify/cors** | 9.x | CORS para frontend Next.js em domínio diferente | Essencial se API e frontend em deploys separados |
| **@fastify/type-provider-zod** | 5.x | Type provider Zod para schemas das rotas | Validação + tipo automático sem duplicação. Funciona com Zod v4 |
| **drizzle-orm** | 0.45.2 | ORM + migrations | SQL explícito, bundle ~10% do Prisma, migrações declarativas. Suporte nativo a Neon via `drizzle-orm/neon` |
| **drizzle-kit** | 0.31.10 | CLI de migrações | `generate`, `push`, `pull`, `studio` |
| **Neon (serverless Postgres)** | 1.1.0 | Banco de dados | Serverless, escala a zero quando ocioso, 100 CU-hrs/mês grátis (~90 hrs/mês = 3h/dia de 1 CU) |
| **drizzle-zod** | 0.8.3 | Schema Zod a partir de tabelas Drizzle | Gera schemas Zod automaticamente do banco. Compatível com Zod v4 (`'^3.25.0 \|\| ^4.0.0'`) |

#### Fastify + Vercel: Atenção

Fastify 5 com `@fastify/vercel` tem limitações:
- Conexões longas (WebSocket) não funcionam em serverless
- Cold start em cada requisição
- Neon HTTP query mode (sem ws) é necessário

**Recomendação:** Deploy da API em **Render** (free tier, Node, sem cold start) ou **Railway** (free $5 credit/mês) em vez de Vercel. Frontend Next.js no Vercel. Se insistir em Vercel, use Next.js API routes como fallback e refatore para Fastify separado depois.

### Frontend — Next.js

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 15.x | Framework React + deploy Vercel | App Router, Server Components, layout otimizado |
| **React** | 19.x | UI library | Next.js 15 suporta React 19 nativamente |
| **shadcn/ui** | latest | Componentes de UI | `Table`, `Badge`, `Select`, `Slider`, `Input`, `ToggleGroup`, `Skeleton`, `Sheet`, `Chart`, `Dialog`. Código no seu repo (não é lib externa) |
| **@tanstack/react-table** | 8.21.3 | Data Table completa | Sort multi-coluna, filtros por coluna, paginação cliente-side, row selection, column visibility |
| **Tailwind CSS** | 4.x | Estilização | shadcn/ui é construído em cima do Tailwind. Versão 4 mais rápida (engine Rust) |
| **URL params** | nativo | Estado dos filtros | Sem Zustand, sem Redux. Sort, filtro, página viram query params. Compartilhável, bookmarkable |

#### Por que sem Zustand/Redux?

TanStack Table gerencia sort, filter, pagination internamente via `useReactTable()`. URL params salvam/restauram estado entre sessões. Para uma tabela de preços, isso cobre 100% dos casos de uso. Adicionar Zustand só aumenta bundle e complexidade sem benefício.

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **GitHub Actions** | — | Cron de scraping (6-8h) | Free tier: 2.000 min/mês. Estimativa: ~1.350 min (~15 min/ciclo × 90 ciclos/mês). Dentro do limite |
| **Neon (Postgres)** | serverless | Banco de dados | Free: 0.5 GB/projeto, 100 CU-hrs/mês. Escala a zero quando ocioso |
| **Vercel** | — | Deploy frontend Next.js | Free tier suficiente para painel pessoal (sem tráfego pesado) |
| **Render** (alternativa) | — | Deploy API Fastify | Free tier: 750 hrs/mês (~31 dias), Node services com zero cold start |

### Spec Parser

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Regex** | nativo | Parse de 80% dos títulos | Títulos estruturados (Kabum, Pichau) seguem padrões: `"Notebook Gamer [Marca] [Tela] [CPU] [RAM] [Storage] [GPU]"` |
| **Claude API** | — | Fallback para títulos complexos | Mercado Livre, Terabyte têm títulos inconsistentes. API é barata para este volume |

### Development & Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | latest | Test runner | Compatível com Vite, rápido, TypeScript nativo, watch mode |
| **Biome** | 1.x | Linter + formatter | 10x mais rápido que ESLint + Prettier. Formata e lint em um binário |
| **tsx** | 4.x | Execução TS para scripts de scraper | `npx tsx src/scrapers/kabum.ts` — roda scripts sem compilação |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Browser automation | **Playwright 1.60.0** | Puppeteer 24.43.1 | Stealth plugin parado há 3 anos (v2.11.2, último release 2022). Puppeteer saltou para v24. Risco alto de detecção em sites Cloudflare |
| Browser automation (fallback) | **Puppeteer 22** | Puppeteer 24 | Se insistir em puppeteer-extra, usar v22 (última compatível com stealth v2.11.2) |
| ORM | **Drizzle 0.45.2** | Prisma | Bundle ~10% do Prisma, SQL explícito, sem lock-in de schema DSL, suporte Neon nativo |
| HTTP framework | **Fastify 5.8.5** | Express 4.x | Fastify 2-3x mais rápido, JSON Schema validation, serialization otimizada, type providers |
| Banco | **Neon (Postgres serverless)** | SQLite (via Turso/libSQL) | Scraper (GHA) e frontend (Vercel) precisam do MESMO banco remoto. SQLite não resolve sem servidor intermediário |
| DB driver | **@neondatabase/serverless 1.1.0** | pg (node-postgres) | Neon: HTTP + WebSocket nativo, otimizado para serverless. `pg` não escala a zero |
| Frontend state | **URL params** | Zustand / Redux | TanStack Table gerencia estado interno. URL params são bookmarkable e compartilháveis. Zero deps extra |
| Validação | **Fastify Zod type provider** | TypeBox | Zod já está na stack (scraper + drizzle-zod), então usar o mesmo schema evita duplicar tipos |
| Component library | **shadcn/ui** | MUI / Radix | shadcn gera código no SEU repo. Customizável sem theme tokens. TanStack Table integração oficial nos docs |
| Node.js parser | **Node 22 fetch + Cheerio** | Axios + JSDOM | Axios tem 3x mais downloads mas Node 22 já tem fetch nativo. JSDOM é pesado (parseia DOM completo), Cheerio é mais leve |

---

## Brazilian E-commerce Specific Considerations

### Anti-Bot Reality Check

| Site | Abordagem | Ferramenta | Notas |
|------|-----------|------------|-------|
| **Kabum** | API pública (DevTools) | `fetch` nativo | Endpoint REST sem auth. Endpoint descoberto por DevTools. Sem proteção anti-bot |
| **Mercado Livre** | API oficial | `fetch` nativo | `api.mercadolibre.com/sites/MLB/search?q=notebook`. Rate limit liberal (~10 req/min sem app ID). Documentado em developers.mercadolivre.com.br |
| **Pichau** | API interna (DevTools) | `fetch` nativo | Semelhante à Kabum. Pode exigir headers específicos (User-Agent, Referer) |
| **Terabyte** | Cheerio | Cheerio 1.2.0 | HTML server-rendered. Zero proteção. Fácil |
| **Magalu** | Cheerio (fase 2) | Cheerio 1.2.0 | Catálogo é server-rendered. Páginas de produto podem ter JS. Se detectar proteção, upgrade para Playwright |
| **Americanas** | Playwright (fase 3) | Playwright 1.60.0 | **Cloudflare.** Requer anti-detection. Playwright com `channel: 'chrome'` (Chrome de sistema) + user-agent real + viewport aleatório |
| **Amazon BR** | PA-API | `fetch` + API oficial | Precisa de conta Amazon Associates (gratuita). API oficial com rate limit. Sem scraping |

### Estratégia de User-Agent e Headers

Sempre usar headers realistas nos scrapers:

```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36
Accept-Language: pt-BR,pt;q=0.9,en;q=0.8
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
```

- Rodar de GitHub Actions = IPs AWS/US. Se um site BR bloqueia IPs estrangeiros, usar proxy BR ou torcer pelo cache CDN
- Rate limiting: adicionar delay aleatório entre requisições (500-2000ms) via `setTimeout` ou `p-limit`

### Mercado Livre API — Detalhes

- Endpoint de busca: `GET https://api.mercadolibre.com/sites/MLB/search?q=notebook&limit=50&offset=0`
- Sem auth necessária para busca básica (rate limit ~10 req/min)
- Com app registration: rate limit maior + acesso a dados completos do seller
- Retorna: `results[].{id, title, price, currency_id, available_quantity, condition, catalog_product_id}`
- **Pro tip:** Usar `catalog_product_id` para agrupar mesmo produto de sellers diferentes e pegar o menor preço

### Amazon PA-API — Atenção

- Requer: conta Amazon Associates (gratuita), access key + secret
- Endpoint: `PA-API` (Product Advertising API) — SOAP/REST
- Rate limit: baixo (1 req/s no tier gratuito)
- Não retorna preço de todos os sellers — só o melhor preço + ofertas
- **Vale a pena?** Sim, porque Amazon BR é a maior fonte de preços competitivos. Mas só na Fase 3.

---

## Installation — Stack Completa

```bash
# ===== SCRAPER (dentro de packages/scraper/) =====
npm install cheerio zod
npm install -D playwright @playwright/test        # browser automation
npx playwright install chromium                    # download browser binary
npm install -D tsx vitest biome

# ===== API (dentro de packages/api/) =====
npm install fastify @fastify/cors @scalar/fastify-api-reference \
  @fastify/type-provider-zod zod \
  drizzle-orm @neondatabase/serverless drizzle-zod
npm install -D drizzle-kit @types/node tsx vitest biome

# ===== FRONTEND (dentro de packages/web/) =====
npx create-next-app@latest web --typescript --tailwind --eslint
npx shadcn@latest init
npx shadcn@latest add table badge select slider input toggle-group skeleton sheet chart dialog
npm install @tanstack/react-table

# ===== ROOT (monorepo opcional) =====
npm install -D typescript @total-typescript/ts-reset biome
```

### Neon Setup

```bash
# 1. Criar conta em neon.tech (gratuito, sem cartão)
# 2. Criar projeto → copiar DATABASE_URL
# 3. Adicionar ao GitHub Actions como secret
# 4. Drizzle config:

# drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## Dependencies with Versions Locked

```json
{
  "dependencies": {
    "zod": "^4.4.3",
    "cheerio": "^1.2.0",
    "fastify": "^5.8.5",
    "@fastify/cors": "^9.0.0",
    "@fastify/type-provider-zod": "^5.0.0",
    "@scalar/fastify-api-reference": "^1.55.3",
    "drizzle-orm": "^0.45.2",
    "drizzle-zod": "^0.8.3",
    "@neondatabase/serverless": "^1.1.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-table": "^8.21.3"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "playwright": "^1.60.0",
    "@playwright/test": "^1.60.0",
    "drizzle-kit": "^0.31.10",
    "vitest": "^3.0.0",
    "biome": "^1.9.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Core stack** | HIGH | Versões verificadas via npm registry. Todos os pacotes são estáveis e amplamente adotados |
| **Playwright > Puppeteer** | HIGH | Stealth plugin 2.11.2 parado há 3 anos. Playwright 1.60.0 ativo e melhor suportado |
| **Zod v4** | MEDIUM | drizzle-zod suporta v4, mas é recente. Se quebrar, pin para Zod 3.x (`zod@^3.23.0`) |
| **Neon free tier** | HIGH | 100 CU-hrs/mês é mais que suficiente para scraping 3h/dia |
| **Drizzle v0.45 (stable)** | HIGH | Estável, produção-ready. v1.0.0-beta existe mas é experimental |
| **Fastify + Vercel** | LOW | `@fastify/vercel` tem limitações. Deploy separado (Render/Railway) é recomendado |
| **Anti-bot (Phase 3)** | MEDIUM | Cloudflare evolui rápido. Playwright pode precisar de tuning adicional para Americanas |

---

## Upgrade Paths

| Current | When to Upgrade | To | Reason |
|---------|----------------|-----|--------|
| Drizzle 0.45.x | After v1 stable release | Drizzle 1.x | API estável, menos breaking changes futuros |
| Zod v4.x | N/A (start with v4) | — | drizzle-zod já suporta |
| Playwright 1.60.x | Minor updates | 1.x+ | Correções de anti-detection |
| Fastify 5.x | Major Fastify 6 | 6.x | Avaliar mudanças |
| Next.js 15 → Next.js 16 | When Next 16 stable | 16.x | Se houver benefícios de performance |

---

## Sources

- **npm registry** — Versões verificadas via `npm view` (2025-05-12)
- **Zod GitHub** — `zod@4.4.3`, [github.com/colinhacks/zod](https://github.com/colinhacks/zod)
- **Fastify** — `fastify@5.8.5`, [fastify.dev](https://fastify.dev)
- **Drizzle** — `drizzle-orm@0.45.2`, [orm.drizzle.team](https://orm.drizzle.team)
- **Neon** — `@neondatabase/serverless@1.1.0`, [neon.tech/pricing](https://neon.tech/pricing)
- **shadcn/ui Data Table** — [ui.shadcn.com/docs/components/data-table](https://ui.shadcn.com/docs/components/data-table)
- **Mercado Livre API** — [developers.mercadolivre.com.br](https://developers.mercadolivre.com.br)
- **Playwright** — `playwright@1.60.0`, [playwright.dev](https://playwright.dev)
- **drizzle-zod peer deps** — Confirma compatibilidade com Zod v4: `'^3.25.0 || ^4.0.0'`
- **puppeteer-extra-plugin-stealth** — `v2.11.2`, última publicação 2022. [npmjs.com/package/puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth)
