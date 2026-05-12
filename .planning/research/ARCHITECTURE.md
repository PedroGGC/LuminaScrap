# Architecture Research

**Domain:** Price aggregation / web scraping for Brazilian e-commerce
**Researched:** 2026-05-12
**Confidence:** HIGH (for general architecture), MEDIUM (for site-specific anti-bot — verified via HTTP probes)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SCHEDULER LAYER (GitHub Actions)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ GHA Cron     │  │ Manual       │  │ Webhook      │              │
│  │ (6-8h cycle) │  │ Trigger      │  │ (future)     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
├─────────┴─────────────────┴─────────────────┴───────────────────────┤
│                     SCRAPER LAYER                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Kabum    │  │ ML       │  │ Pichau   │  │ Terabyte │             │
│  │ (fetch)  │  │ (browser)│  │ (browser)│  │ (browser)│             │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘             │
│        │             │             │             │                   │
│  ┌─────┴─────────────┴─────────────┴─────────────┴────┐             │
│  │              Magalu (browser)                       │             │
│  └────────────────────────┬───────────────────────────┘             │
│                           │                                         │
├───────────────────────────┴─────────────────────────────────────────┤
│                     PARSER PIPELINE                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Raw Product Title → Regex Matcher → (fail?) → Claude API    │   │
│  │  Output: { cpu, gpu, ram, storage, screen, brand, model }   │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │                                           │
├─────────────────────────┴───────────────────────────────────────────┤
│                     VALIDATION LAYER (Zod)                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Schema: productSchema → notebookSchema → priceSchema        │   │
│  │  Coerce types, strip unknown, report parsing errors          │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │                                           │
├─────────────────────────┴───────────────────────────────────────────┤
│                     DATABASE (Neon PostgreSQL)                       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐        │
│  │ products   │  │ prices       │  │ parse_errors (log)   │        │
│  │ (base)     │  │ (time-series)│  │ (debug aid)          │        │
│  └──────┬─────┘  └──────┬───────┘  └──────────────────────┘        │
│         │               │                                           │
│  ┌──────┴────────────────┴──────┐                                   │
│  │  notebooks (extends product)  │                                   │
│  └──────────────────────────────┘                                   │
├─────────────────────────────────────────────────────────────────────┤
│                     API LAYER (Fastify — Vercel/VPS)                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐              │
│  │ GET      │  │ GET          │  │ GET              │              │
│  │ /notebooks│  │ /notebooks/:id│  │ /notebooks/:id/ │              │
│  │ (list+   │  │ (detail)     │  │ prices           │              │
│  │ filters) │  │              │  │ (history)        │              │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘              │
│       │               │                   │                         │
├───────┴───────────────┴───────────────────┴─────────────────────────┤
│                     FRONTEND (Next.js — Vercel)                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  TanStack Table + shadcn/ui filters (CPU, GPU, RAM, price,   │   │
│  │  brand) + URL params for state + Skeleton loading             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Scheduler** | Trigger scrape cycles on cron (6-8h), support manual trigger | GitHub Actions scheduled workflow + workflow_dispatch |
| **Scraper — Static** | Fetch HTML from sites without JS rendering requirement | `fetch` + Cheerio for Kabum |
| **Scraper — Browser** | Render JS-heavy pages, bypass anti-bot detection | Puppeteer + `puppeteer-extra-plugin-stealth` for ML, Pichau, Terabyte, Magalu |
| **Scraper — API** | Consume official APIs where available | `fetch` for Kabum public API, potentially ML developer API with auth |
| **Parser Pipeline** | Convert raw product titles into structured technical specs | Regex (80% coverage) → Claude API fallback (20%) |
| **Validator** | Ensure data integrity before database insertion | Zod schemas per table, reject on type mismatch |
| **Database** | Store products, time-series prices, error logs | Neon PostgreSQL, Drizzle ORM |
| **API** | Serve filtered product lists, detail views, price history | Fastify with Zod validation on all endpoints |
| **Frontend** | Interactive table with technical filters, responsive layout | Next.js + shadcn/ui + TanStack Table |

## Recommended Project Structure

```
scraper/                          # Monorepo root
├── packages/
│   ├── scraper-core/             # Shared scraper utilities
│   │   ├── src/
│   │   │   ├── browser.ts        # Puppeteer setup (stealth, UA rotation)
│   │   │   ├── fetcher.ts        # Simple fetch wrapper (for static)
│   │   │   ├── extractors/       # Shared extraction helpers
│   │   │   │   ├── price.ts      # Price normalization (R$ 1.234,56 → 1234.56)
│   │   │   │   ├── specs.ts      # Spec regex patterns (CPU, GPU, RAM, etc.)
│   │   │   │   └── pagination.ts # Next page URL extraction
│   │   │   └── types.ts          # Shared TypeScript types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── scraper-kabum/            # Kabum (API / Cheerio)
│   │   ├── src/
│   │   │   ├── index.ts          # Orchestrator: run → validate → insert
│   │   │   ├── notebook-list.ts  # Fetch/search notebook listings
│   │   │   └── parse.ts          # Site-specific parser
│   │   └── package.json
│   │
│   ├── scraper-mercado-livre/    # Mercado Livre (Puppeteer)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── search.ts         # Puppeteer search flow
│   │   │   └── parse.ts
│   │   └── package.json
│   │
│   ├── scraper-pichau/           # Pichau (Puppeteer)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── search.ts
│   │   │   └── parse.ts
│   │   └── package.json
│   │
│   ├── scraper-terabyte/         # Terabyte (Puppeteer)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── search.ts
│   │   │   └── parse.ts
│   │   └── package.json
│   │
│   ├── scraper-magalu/           # Magalu (Puppeteer)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── search.ts
│   │   │   └── parse.ts
│   │   └── package.json
│   │
│   ├── parser-pipeline/          # Product title → structured specs
│   │   ├── src/
│   │   │   ├── index.ts          # Main pipeline entry
│   │   │   ├── regex-parser.ts   # Regex-based spec extraction
│   │   │   ├── claude-fallback.ts# Claude API for complex titles
│   │   │   ├── cpu-map.ts        # CPU model alias mapping (i5-13420H → Intel Core i5 13th Gen)
│   │   │   ├── gpu-map.ts        # GPU alias mapping
│   │   │   └── brands.ts         # Brand normalization
│   │   └── package.json
│   │
│   ├── schema/                   # Shared Drizzle schema definitions
│   │   ├── src/
│   │   │   ├── products.ts       # products table
│   │   │   ├── notebooks.ts      # notebooks table (extends products)
│   │   │   ├── prices.ts         # prices table (time-series)
│   │   │   ├── parse-errors.ts   # parse_errors log table
│   │   │   └── index.ts          # Export all
│   │   └── package.json
│   │
│   ├── api-server/               # Fastify API
│   │   ├── src/
│   │   │   ├── index.ts          # Server setup + listen
│   │   │   ├── routes/
│   │   │   │   ├── notebooks.ts  # GET /notebooks, GET /notebooks/:id
│   │   │   │   ├── prices.ts     # GET /notebooks/:id/prices
│   │   │   │   └── scrape.ts     # POST /scrape (manual trigger)
│   │   │   ├── services/
│   │   │   │   ├── notebook-service.ts    # Query logic
│   │   │   │   └── price-service.ts       # History aggregation
│   │   │   └── filters.schema.ts # Zod schemas for query params
│   │   └── package.json
│   │
│   ├── frontend/                 # Next.js application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx      # Main table + filters
│   │   │   │   ├── layout.tsx    # Root layout (providers)
│   │   │   │   └── api/          # Optional: API routes if same-host
│   │   │   ├── components/
│   │   │   │   ├── data-table.tsx      # TanStack Table wrapper
│   │   │   │   ├── filters-bar.tsx     # Filter controls
│   │   │   │   └── product-detail.tsx  # Sheet/dialog detail view
│   │   │   └── lib/
│   │   │       ├── api-client.ts       # Fetch wrapper for API
│   │   │       └── filters.ts          # URL param ↔ filter mapping
│   │   └── package.json
│   │
│   └── orchestrator/             # GHA entry: runs all scrapers
│       ├── src/
│       │   ├── index.ts          # Orchestrator: sequential run
│       │   ├── runner.ts         # Spawn individual scraper packages
│       │   └── reporter.ts       # Summarize results, error collection
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── scrape-scheduled.yml  # Cron every 6-8h
│       └── scrape-manual.yml     # workflow_dispatch
│
├── package.json                  # Root workspace config (pnpm workspaces)
├── pnpm-workspace.yaml
└── tsconfig.json
```

### Structure Rationale

- **Per-site scraper packages:** Each e-commerce site has unique anti-bot requirements, DOM structure, and parsing logic. Isolating them avoids cross-contamination of selectors and strategies. Adding a new source means adding a package + 1 line in the orchestrator.
- **`scraper-core` shared:** Browser setup (Puppeteer + stealth), price normalization, pagination logic — extracted once, reused by all browser-based scrapers.
- **`parser-pipeline` as a separate package:** The spec extraction logic is the most iterated component. Separating it from scrapers means you can improve parsing without touching scraper code. Also makes it testable in isolation.
- **Orchestrator last:** The orchestration entrypoint is intentionally thin — it just iterates scraper packages, calls them, and aggregates results. This makes it trivial to add/remove scrapers without architectural changes.

## Architectural Patterns

### Pattern 1: Strategy Per Source (Strategy Pattern)

**What:** Each e-commerce source gets its own scraper implementation that implements a shared `Scraper` interface.

```typescript
// scraper-core/src/types.ts
export interface ScraperResult {
  products: ScrapedProduct[];
  errors: ScrapeError[];
  metadata: { source: string; durationMs: number; pagesScraped: number };
}

export interface Scraper {
  readonly source: string; // 'kabum' | 'mercadolivre' | 'pichau' | ...
  scrape(): Promise<ScraperResult>;
}

// scraper-kabum/src/index.ts
import { Scraper, ScraperResult } from 'scraper-core';
import { fetchKabumListings } from './notebook-list';

export class KabumScraper implements Scraper {
  readonly source = 'kabum';

  async scrape(): Promise<ScraperResult> {
    const html = await fetch('https://www.kabum.com.br/notebooks');
    // Cheerio parse → product list
    const products = parseKabumHtml(html);
    return { products, errors: [], metadata: { source: 'kabum', durationMs: 0, pagesScraped: 1 } };
  }
}
```

**When to use:** Every scraper. Ensures the orchestrator treats all sources uniformly regardless of internal strategy (fetch vs Puppeteer).

**Trade-offs:** Slightly more boilerplate per scraper, but makes the orchestrator trivially simple.

### Pattern 2: Pipeline Pattern (Parser)

**What:** Raw product titles flow through a processing pipeline: regex → fallback AI → validation.

```typescript
// parser-pipeline/src/index.ts
export async function parseSpecs(title: string): Promise<ParsedSpecs> {
  // Stage 1: Fast regex pass (covers ~80% of titles)
  const regexResult = regexParse(title);
  if (isComplete(regexResult)) {
    return validateSpecs(regexResult);
  }

  // Stage 2: Claude API fallback (complex/unusual titles)
  const aiResult = await claudeParse(title, regexResult);
  return validateSpecs(aiResult);
}
```

**Trade-offs:**
- Regex is fast and free but brittle for unusual title formats
- Claude API handles edge cases but adds latency (~1-3s per call) and cost (~$0.01-0.03 per 1000 titles)
- Cache Claude results by title hash to avoid repeated API calls for identical products across scrape cycles

### Pattern 3: Time-Series Prices (Append-Only)

**What:** Never update a price row — always insert a new one. Query "latest price" via window function.

```typescript
// schema/src/prices.ts
export const prices = pgTable('prices', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric('original_price', { precision: 10, scale: 2 }), // "de:" price if on sale
  currency: varchar('currency', { length: 3 }).default('BRL'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
});

// Get latest price per product (Drizzle + SQL)
// SELECT DISTINCT ON (product_id) * FROM prices ORDER BY product_id, scraped_at DESC
```

**Trade-offs:**
- Wastes storage vs updating in place, but storage is cheap (Neon free tier: 500MB)
- Enables price history charts for free
- Makes price change detection trivial (compare latest two rows per product_id)
- Index on `(product_id, scraped_at DESC)` is critical for performance

## Data Flow

### Scrape Cycle Flow

```
GitHub Actions (scheduled or manual trigger)
    │
    ▼
Orchestrator begins: load environment, connect DB
    │
    ├─▶ scraper-kabum
    │       fetch('https://www.kabum.com.br/notebooks')
    │       Cheerio parse → array of { title, price, url }
    │       Pass each title through parser-pipeline
    │       Zod validate → Drizzle upsert (products + prices)
    │       Log errors to parse_errors table
    │
    ├─▶ scraper-mercado-libre
    │       Puppeteer.launch({ headless, args for GHA })
    │       Go to 'https://lista.mercadolivre.com.br/notebook'
    │       Wait for product cards to render
    │       Extract product data from DOM + JSON-LD
    │       Same parser-pipeline + validate + upsert flow
    │       Browser.close()
    │
    ├─▶ scraper-pichau (same flow as ML, Puppeteer-based)
    │
    ├─▶ scraper-terabyte (same flow)
    │
    └─▶ scraper-magalu (same flow)
    │
    ▼
Orchestrator: log summary (N products found, M errors, total duration)
GitHub Actions: workflow completes
```

### Request Flow (User-facing)

```
User opens frontend
    │
    ▼
Next.js page loads → useEffect fetches GET /api/notebooks?cpu=intel&gpu=rtx4060&minPrice=3000&maxPrice=8000
    │
    ▼
Fastify route receives query params
    │
    ▼
Zod validates query params (types, ranges)
    │
    ▼
notebook-service builds Drizzle query with:
  - WHERE clauses from filters
  - JOIN prices for current price
  - ORDER BY, LIMIT, OFFSET from pagination
    │
    ▼
Neon PostgreSQL executes query, returns rows
    │
    ▼
Fastify transforms response (Drizzle row → API DTO)
    │
    ▼
Frontend receives JSON → TanStack Table renders
  - URL params updated (shareable filter state)
  - Skeleton shown during loading
```

### State Management

```
URL params (source of truth)
    │
    ├── CPU filter        → `?cpu=intel`
    ├── GPU filter        → `?gpu=rtx4060`
    ├── RAM min           → `?minRam=16`
    ├── Price range       → `?minPrice=3000&maxPrice=8000`
    ├── Brand             → `?brand=dell`
    ├── Search text       → `?q=nitro`
    ├── Sort              → `?sort=price_asc`
    └── Page              → `?page=2`
    │
    ▼
TanStack Table reads URL params as initial state
    │
    ▼
User changes filter → URL params update → TanStack re-fetches
    │
    ▼
No global state library needed (intentional design decision)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **Current (MVP)** — 1 user, 5 sources, ~500 products | Monorepo + Serverless: GHA run all scrapers sequentially. Fastify + Neon on free tier. Frontend on Vercel Hobby. |
| **Growing** — 10+ users, 10+ sources, ~5000 products | Parallelize scrapers in GHA matrix jobs. Add response caching (stale-while-revalidate) in API. Index `prices.scraped_at` and `notebooks` filter columns. |
| **Public** — 100+ users, all sources, ~20000+ products | Separate API from frontend (different scaling). Add Redis cache for query results. Consider Neon compute autoscaling. Rate limit frontend API calls. |

### Scaling Priorities

1. **First bottleneck:** Sequential scraper execution at 5+ sources. GHA job time will exceed 15 minutes. Fix: Run scrapers in GHA matrix strategy (parallel per source).
2. **Second bottleneck:** `prices` table size grows linearly with scrape cycles. At 500 products × 3 cycles/day × 365 days = ~550k rows/year. Fine for Neon free tier. At 10x (5M rows), add price compaction (keep daily snapshots older than 30 days).

## Anti-Patterns

### Anti-Pattern 1: Monolithic Scraper

**What people do:** A single `scraper.ts` file with if/else chains for every site.

**Why it's wrong:** When Kabum changes its HTML structure, you risk breaking the ML scraper during refactoring. Adding a new source requires touching the same file, increasing merge conflicts.

**Do this instead:** One package per source. Each implements `Scraper` interface. Adding Kabum v2 = new package, not changing existing code.

### Anti-Pattern 2: Parsing During Scrape

**What people do:** Spec extraction logic mixed inside scraper code.

**Why it's wrong:** You can't improve parsing without re-running scrapers. Makes debugging hard (is the data missing because scraping failed or parsing failed?).

**Do this instead:** Scrapers return raw title+price tuples. The parser pipeline is a separate stage. Log raw titles alongside parsed results in `parse_errors` for debugging.

### Anti-Pattern 3: Overwriting Prices

**What people do:** `UPDATE prices SET price = X WHERE product_id = Y`

**Why it's wrong:** Destroys price history. Can't detect trends, lowest price records, or price change velocity.

**Do this instead:** Always INSERT. Query latest price with `DISTINCT ON (product_id) ORDER BY product_id, scraped_at DESC`. Storage is cheap; history is valuable.

### Anti-Pattern 4: Shared Puppeteer Browser Across Scrapers

**What people do:** Open one browser, reuse for all sites.

**Why it's wrong:** If Pichau's page crashes, it takes down the Kabum scrape too. Browser profiles accumulate cookies/DOM storage from previous sites, potentially leaking state.

**Do this instead:** One browser context per scraper. Close and reopen for each source. The cost of launching Chromium (~2s) is negligible compared to page load times.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Neon PostgreSQL** | Drizzle ORM via `@neondatabase/serverless` connection pool | Use pooled connections in GHA (short-lived). Neon free tier: 500MB, 1 compute unit. |
| **Claude API** | `POST https://api.anthropic.com/v1/messages` with structured output | Use Haiku model (fastest/cheapest for classification). Cache results by SHA256(title). Budget: ~$0.50/mo for 1500 titles/day. |
| **Kabum** | Direct `fetch` (no anti-bot detected) | Cheerio parse HTML. No headers needed beyond standard User-Agent. |
| **Mercado Livre** | Puppeteer + stealth (API returns 403, site is heavy SPA) | Navigate to `lista.mercadolivre.com.br/notebook`. Extract from DOM cards. Also check JSON-LD in page. |
| **Pichau** | Puppeteer + stealth (HTTP 403 from curl — Cloudflare-like) | May need stealth plugin evasion techniques. Expect Cloudflare challenge. |
| **Terabyte** | Puppeteer + stealth (HTTP 403 from curl — Cloudflare) | Same approach as Pichau. Cloudflare JS challenge requires full browser. |
| **Magalu** | Puppeteer + stealth (HTTP 302 redirect) | Cookie consent acceptance likely needed. May require locale header. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Scrapers ↔ Parser** | Direct function call (same process) | Import `parseSpecs` from `parser-pipeline`. Synchronous (regex) or async (Claude). |
| **Parser ↔ Database** | Drizzle ORM methods | Each scraper calls `db.insert(products).values(...)` after parsing. Use `onConflictDoUpdate` for upsert by product URL. |
| **Orchestrator ↔ Scrapers** | Import + direct invocation | Orchestrator imports each Scraper class and calls `.scrape()` sequentially. No IPC needed since GHA runs a single process. |
| **API ↔ Database** | Drizzle ORM via Neon pool | API server uses a persistent connection pool (not short-lived like scrapers). |
| **Frontend ↔ API** | HTTP REST (JSON) | Frontend hosted separately on Vercel, API on Fastify (Vercel or VPS). CORS must be configured on API side. |

## Anti-Bot Strategy Per Site

### Site-by-Site Protection Profile

| Site | curl Status | Protection | Strategy | Estimated Difficulty |
|------|-------------|------------|----------|---------------------|
| **Kabum** | HTTP 200 | None | `fetch` + Cheerio — simplest source | TRIVIAL |
| **Mercado Livre** | HTTP 403 | Cloudflare / SPA detection | Puppeteer + stealth, use real User-Agent, random delays between requests | MEDIUM |
| **Pichau** | HTTP 403 (large body) | Soft block / Cloudflare challenge | Puppeteer + stealth + wait for challenge resolution | MEDIUM-HARD |
| **Terabyte** | HTTP 403 | Cloudflare JS challenge | Puppeteer + stealth, expect 5-10s challenge resolution time | MEDIUM-HARD |
| **Magalu** | HTTP 302 | Cookie consent / region redirect | Puppeteer + accept cookies, set locale header (`pt-BR`) | MEDIUM |

### Common Anti-Bot Countermeasures

1. **Puppeteer Stealth Plugin** (`puppeteer-extra-plugin-stealth`): Evades `navigator.webdriver` detection, modifies Chrome fingerprint to appear as real user. Critical for Cloudflare-protected sites (Pichau, Terabyte).
2. **User-Agent rotation:** Rotate between recent Chrome/Edge desktop UAs on each cycle. Stored in env config.
3. **Randomized delays:** Add `await page.waitForTimeout(random(1000, 3000))` between actions. Avoids pattern detection.
4. **Viewport randomization:** Set viewport to common resolutions (1920×1080, 1366×768, 1440×900).
5. **Cookie consent:** Check for and accept cookie banners on first visit (ML, Magalu).
6. **Headless detection avoidance:** Use `--no-sandbox`, `--disable-setuid-sandbox`, but AVOID `--headless=new` flag on problematic sites — use full headless or `puppeteer-extra`'s built-in evasion.

### GHA-Specific Considerations

- Puppeteer on Ubuntu GHA runners: Install Chromium via `puppeteer` package (auto-downloads).
- Chrome binary weighs ~300MB — GHA caches node_modules so this isn't re-downloaded each run.
- Use `PUPPETEER_CACHE_DIR` env var to control cache location.
- GHA has no display server — set `headless: true` or use `xvfb-run` if full rendering needed (rare).

## KB / Misc Notes

**Kabum Architecture Detail:**
- Kabum uses a static server-rendered site, not an SPA
- Product listing pages return full HTML with data in elements
- Can search via `/busca?q=notebook&page=N`
- Internal API exists at `/produto/{slug}` for product detail pages
- Price data embedded in product cards as text content — simple regex `R$ \d+[\.,]\d+`

**Mercado Livre Architecture Detail:**
- Heavy React SPA — initial page has empty shell, content loaded via XHR
- Search URL: `https://lista.mercadolivre.com.br/notebook` (returns HTML shell + JSON embedded)
- JSON-LD product data available after JS rendering
- Internal API: `https://api.mercadolibre.com/sites/MLB/search?q=notebook` but returns 403 without proper authentication
- Official developer API at `developers.mercadolibre.com` requires app registration
- Rate limit: undocumented but aggressive on unauthenticated requests

**Pichau Architecture Detail:**
- Modern React SPA with API-driven product loading
- Search URL: `https://www.pichau.com.br/search?q=notebook`
- Internal GraphQL endpoint can be discovered via DevTools Network tab
- Cloudflare protection active — Puppeteer + stealth required
- Known to serve different pricing to different IP ranges

**Terabyte Architecture Detail:**
- Traditional server-rendered site with some JS enhancements
- Search: `https://www.terabyteshop.com.br/busca?q=notebook`
- Cloudflare JS challenge on entry — once resolved, page HTML is accessible
- Product data in HTML tables — Cheerio-compatible after browser rendering
- Pricing appears in specific `<span>` and `<div>` patterns

**Magalu Architecture Detail:**
- Large React SPA (Magazine Luiza platform)
- Search: `https://www.magazinevoce.com.br/busca/notebook`
- Heavy API-driven with dozens of XHR calls per page
- Internal product API at unlisted endpoints
- Region detection via IP — may redirect to different subdomain
- Cookie consent wall on first visit

## Sources

- HTTP status verification tests performed 2026-05-12 (curl probes to each site)
- Puppeteer official docs: https://pptr.dev/
- puppeteer-extra (stealth plugin): https://github.com/berstend/puppeteer-extra
- Mercado Livre developers portal (API docs): https://developers.mercadolibre.com/
- Web scraping extraction patterns reference (web-scraper skill)
- Project report: `relatorio-scraper-painel.md`
- PROJECT.md: phase planning document

---
*Architecture research for: Brazilian e-commerce price monitoring panel*
*Researched: 2026-05-12*
