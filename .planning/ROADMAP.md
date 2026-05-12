# Roadmap: Painel de Preços de Notebooks

## Overview

Build a personal price monitoring panel that aggregates notebook prices from Brazilian retailers into an interactive filterable table. Start with Kabum and Mercado Livre (easiest sources) to validate the scraper→parser→database→API→frontend pipeline. Add Cloudflare-protected retailers (Pichau, Terabyte, Magalu) with Playwright stealth in Phase 2. Scale to Amazon BR, manufacturers, comparison tools, and PC components in Phase 3. GPU+CPU+RAM combined filtering is the primary differentiator vs competitors (Zoom, Buscapé, Bench Promos).

## Phases

- [ ] **Phase 1: Foundation & MVP** - Monorepo scaffold, Drizzle schema (Neon), Kabum + ML scrapers, spec parser, Fastify API, Next.js table frontend, GHA cron. Ships the full v1 MVP.
- [ ] **Phase 2: More Sources & Price History** - Pichau, Terabyte, Magalu scrapers (Playwright + stealth), price history charts, detail sheet, product deduplication, parser refinements.
- [ ] **Phase 3: Scale & Advanced** - Americanas, Amazon BR, manufacturer scrapers, side-by-side comparison, PC components module, PCs montados.

## Phase Details

### Phase 1: Foundation & MVP
**Goal**: Users can browse notebooks from Kabum and Mercado Livre with technical spec filters (CPU, GPU, RAM, storage, brand, price). Prices refresh automatically every 6-8h.
**Depends on**: Nothing (first phase)
**Requirements**: SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04, SCRAPE-05, PARSE-01, PARSE-02, PARSE-03, PARSE-04, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, API-01, API-02, API-03, API-04, API-05, UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. User can view an interactive table listing notebooks from Kabum and Mercado Livre with columns: name, brand, CPU, GPU, RAM, storage type+size, price (R$), store, last-updated timestamp
  2. User can filter notebooks by CPU, GPU, minimum RAM, brand, and price range — results update immediately
  3. User can search by product name and sort any column (ascending/descending)
  4. User can share a filtered URL — opening it reproduces the exact same filters via URL params
  5. Prices are no more than 8 hours old — GHA cron job runs automatically without manual intervention
  6. User can view detailed notebook info via API docs at `/docs` (Scalar)
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [ ] 01-01: Monorepo scaffold + Drizzle schema (products, notebooks, prices, product_groups, scrape_logs, parse_errors) + Neon setup + migrations
- [ ] 01-02: Kabum scraper (fetch + Cheerio) + Mercado Livre scraper (official API) + GHA matrix workflow (6-8h cron)
- [ ] 01-03: Spec parser pipeline (regex + lookup for 80% coverage, async Claude API fallback) + Brazilian price normalization + test suite
- [ ] 01-04: Fastify API server (GET /notebooks with filters, GET /notebooks/:id, GET /prices/:id, POST /scrape, Scalar docs) + Render deploy
- [ ] 01-05: Next.js frontend (TanStack Table + shadcn/ui) with interactive table, filter bar, text search, URL param state, loading skeleton, badges + Vercel deploy

### Phase 2: More Sources & Price History
**Goal**: Users see notebooks from 5 retailers (added Pichau, Terabyte, Magalu), view price history charts, see grouped products across stores, and get trend indicators.
**Depends on**: Phase 1
**Requirements**: SCRAPE-06, SCRAPE-07, SCRAPE-08, API-06, API-07, UI-08, UI-09, DATA-06, PARSE-05, PARSE-06
**Success Criteria** (what must be TRUE):
  1. User sees notebooks from Pichau, Terabyte, and Magalu alongside Kabum + ML (5 retailers total, same table)
  2. User can click any notebook to view a price history chart showing price changes over time (7/30/90 day views)
  3. User can open a detail sheet (shadcn Sheet) with full notebook specs: screen size, OS, category (Gamer/Office/Workstation)
  4. Same notebook model from different stores appears grouped as one product entry with all prices listed
  5. User sees price trend indicators (↑/↓ arrows with percentage change, e.g. "Subiu 5% em 7 dias")
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [ ] 02-01: Pichau scraper (Playwright + stealth, Cloudflare bypass) + Terabyte scraper (Playwright, HTML dinâmico) + Magalu scraper (Playwright, cookie consent + JS render)
- [ ] 02-02: Price history endpoint aggregation + price chart component (recharts/chart.js) with 7/30/90 day views + price trend indicator
- [ ] 02-03: Detail sheet (shadcn Sheet) with full specs (screen, OS, Gamer/Workstation classification) + product dedup matching pipeline (fuzzy match on brand+CPU+RAM+storage)
- [ ] 02-04: Parser refinements — Gamer/Office/Workstation classifier (GPU+CPU based), screen size extraction, CPU generation indicator

### Phase 3: Scale & Advanced
**Goal**: Users can find notebooks from the broadest set of sources (Americanas, Amazon BR, Dell, Avell, Acer), compare 2-3 side-by-side, and browse PC components + pre-built PCs.
**Depends on**: Phase 2
**Requirements**: SCRAPE-09, SCRAPE-10, SCRAPE-11, UI-10, MODL-01, MODL-02
**Success Criteria** (what must be TRUE):
  1. User can find notebooks from Americanas, Amazon BR, and manufacturers (Dell, Avell, Acer) in the main table
  2. User can compare 2-3 notebooks side-by-side in a dialog showing all specs in parallel columns
  3. User can browse PC components (CPUs, GPUs, RAM sticks, SSDs, HDDs) with prices from multiple retailers
  4. User can browse pre-built PCs with component-level specs extracted and displayed
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [ ] 03-01: Americanas scraper (Playwright + stealth, heavy anti-detection) + Amazon BR scraper (PA-API with rate limit management)
- [ ] 03-02: Manufacturer scrapers — Dell direct pages, Avell configurator, Acer store (DevTools per site)
- [ ] 03-03: Side-by-side comparison dialog (2-3 notebooks, parallel spec columns, price comparison)
- [ ] 03-04: PC components module — scraper + parser + schema + table for CPU, GPU, RAM, SSD, HD; pre-built PC scraper with component extraction

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & MVP | 0/5 | Not started | - |
| 2. More Sources & Price History | 0/4 | Not started | - |
| 3. Scale & Advanced | 0/4 | Not started | - |
