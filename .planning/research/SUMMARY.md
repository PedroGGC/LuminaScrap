# Project Research Summary

**Project:** Painel de Preços de Notebooks (Brasil)
**Domain:** Web scraping + price aggregation for Brazilian e-commerce
**Researched:** 2026-05-12
**Confidence:** HIGH (stack, architecture, features); MEDIUM (anti-bot evasion at scale)

## Executive Summary

This project is a **personal price monitoring panel** that aggregates notebook prices from multiple Brazilian e-commerce retailers into an interactive table with technical spec filters (CPU, GPU, RAM). Research confirms this is a well-understood domain with established patterns (scraper → parser → database → API → frontend), but Brazilian e-commerce introduces **unique challenges**: Cloudflare anti-bot protection, inconsistent product title formats, Brazilian locale price formatting, and retailer-specific HTML structures that change without notice.

**Recommended approach:** Build in three phases with a **parser-first mindset**. The spec parser (regex extracting CPU/GPU/RAM/storage from product titles) is the project's critical path — without reliable spec extraction, all filtering features fail. Phase 1 delivers a working MVP with Kabum (simplest source, no anti-bot) and Mercado Livre (official API), establishing schema, parser, and core UI before tackling harder sources. Phase 2 adds Cloudflare-protected retailers (Pichau, Terabyte, Magalu) with Puppeteer + stealth. Phase 3 scales to Amazon BR, Americanas, and manufacturer direct sources.

**Key risks:** (1) Cloudflare blocking Pichau and Terabyte requires Puppeteer + stealth, not Cheerio as initially assumed — update all scraper plans accordingly. (2) Spec parser degradation over time must be prevented with a test suite, validation layer, and normalization from day one. (3) Duplicate product detection across retailers requires a `product_groups` table in the Phase 1 schema even if matching logic ships later. (4) GitHub Actions free tier (2,000 min/month) may be exhausted once Puppeteer-heavy sources are added — design for Puppeteer-minimal architecture and add a budget monitor.

## Key Findings

### Recommended Stack

**Full stack:** Node.js 22 + TypeScript 5 + pnpm monorepo with per-source scraper packages.

**Scraper layer:** Playwright 1.60 (replaces Puppeteer recommended in PROJECT.md — the `puppeteer-extra-plugin-stealth` has been abandoned since 2022, making it high-risk for Cloudflare-protected sites). Cheerio 1.2 for static HTML (Kabum). Zod 4 for validation.

**API layer:** Fastify 5 (2-3x faster than Express, native JSON Schema validation). Drizzle 0.45 ORM (bundle ~10% of Prisma, SQL-explicit). Neon serverless PostgreSQL (free tier: 500MB, 100 CU-hrs/month). Deploy API on Render/Railway, not Vercel (Fastify + Vercel has cold start and WebSocket limitations).

**Frontend:** Next.js 15 + React 19 + shadcn/ui + TanStack Table 8. **No Zustand/Redux** — URL params are the source of truth for filter state; TanStack Table manages internal sorting/pagination/filtering.

**Infrastructure:** GitHub Actions cron (6-8h cycle) for scraping. Estimated ~1,350 min/month with 5-10 sources — within free tier limit but tight once Puppeteer enters the picture.

**Core technologies:**
- **Playwright 1.60:** Browser automation for anti-bot sites — better anti-detection baseline than Puppeteer, official GitHub Actions support, cross-browser
- **Cheerio 1.2:** Static HTML parsing (~11KB gzip) — for Kabum and any server-rendered pages
- **Zod 4 + Drizzle 0.45 + Neon:** End-to-end type safety from scraper → validation → database → API
- **Fastify 5:** HTTP framework with Zod type provider for zero-duplication validation
- **TanStack Table 8 + shadcn/ui:** Interactive data table with column sorting, filtering, and responsive design

### Expected Features

**Must have (table stakes):**
- Multi-retailer price display with cheapest-price computation — **core purpose**
- Search by product name/model — free text + autocomplete
- Sort by price, relevance — ASC/DESC toggle
- Brand filter, price range slider — expected by any shopping tool
- Last-updated timestamp per product — green/yellow/red age badge
- Direct link to retailer — user clicks → opens product page
- Responsive layout (mobile) — Brazilian shopping is heavily mobile
- Pagination — 12-20 items per page

**Should have (competitive — what makes this project worth building):**
- **GPU model filter** — no Brazilian competitor does this well for notebooks. **Primary differentiator.**
- **Combined CPU+GPU+RAM filter** — no competitor offers combined technical filtering. **Gap in the market.**
- CPU filter + CPU generation indicator — present in Bench Promos, expected by power users
- RAM size filter — common in competitors
- Storage type+size filter (SSD vs HD) — rare in competitors, valued differentiator
- Price history chart (30/60/90 days) — CamelCamelCamel does this for Amazon only
- Price trend indicator (↑/↓ with percentage) — immediate at-a-glance value
- "Gamer" vs "Office" auto-classification — ML or rule-based tagging

**Defer (v2+):**
- Side-by-side comparison (2-3 products) — significant UX complexity
- Coupon/discount code display — requires manual or partner maintenance
- Screen specs filter (resolution, refresh rate) — rarely in titles, needs deep scraping
- Best value score — subjective, risk of being gamed
- Weight/portability indicator — spec rarely in titles

### Architecture Approach

**Monorepo with per-site scraper packages,** each implementing a shared `Scraper` interface (Strategy Pattern). An orchestrator iterates scrapers sequentially (Phase 1), evolving to parallel matrix jobs (Phase 2+). The spec parser is a **separate package** (`parser-pipeline`) using regex (80% coverage) with an async Claude API fallback for complex titles — parsed results flow through Zod validation before database insertion. Prices follow an **append-only time-series pattern** (never update in place), enabling history charts and price change detection via `DISTINCT ON (product_id) ORDER BY scraped_at DESC`. Frontend state lives in URL params — no global state library needed.

**Major components:**
1. **Orchestrator** — GHA entrypoint; iterates scraper packages, aggregates results, logs per-source status
2. **Per-site scrapers** — Each implements `Scraper` interface; static (fetch+Cheerio) or browser (Playwright) strategy
3. **Parser pipeline** — Regex → optional Claude AI fallback → Zod validation; outputs structured {cpu, gpu, ram, storage, screen, brand, model}
4. **Database** — Neon PostgreSQL via Drizzle ORM; tables: `products`, `notebooks` (extends products), `prices` (time-series), `product_groups` (dedup), `scrape_logs`, `parse_errors`
5. **Fastify API** — REST endpoints: `GET /notebooks`, `GET /notebooks/:id`, `GET /notebooks/:id/prices`; Zod-validated query parameters
6. **Next.js frontend** — TanStack Table + shadcn/ui with filter bar; URL params drive state; responsive mobile-first layout

### Critical Pitfalls

1. **Cloudflare on Pichau and Terabyte blocks simple scraping** — Both sites return "Just a moment..." to non-browser requests. Cheerio-only strategy will fail. **Fix:** Use Playwright + stealth; test locally before GHA deploy; set MAX_RETRIES=2 per source. Addressed in Phase 2 planning.

2. **Spec parser reliability degrades over time** — Regex covers ~80% of titles at launch, but new CPU/GPU generations and retailer format changes silently break parsing. **Fix:** Build parser test suite with 20+ known titles from day one; log parse failures to `parse_errors` table; make Claude API async batch (not sync hot-path). Addressed in Phase 1.

3. **Duplicate product detection fails** — Same notebook model sold at Kabum, ML, and Pichau with different titles → treated as different products. **Fix:** Add `product_groups` table in Phase 1 schema (even if empty); extract model numbers from titles; implement fuzzy matching pipeline in Phase 2. Schema must exist before Phase 2 sources arrive.

4. **Brazilian price formatting causes numeric parsing errors** — `"R$ 1.234,56"` vs `"R$1.234,56"` vs `"12x de R$ 199,90"`. JavaScript's `parseFloat("1.234,56")` returns `1.234` instead of `1234.56`. **Fix:** Dedicated `parseBrazilianPrice()` function with comprehensive unit tests; Zod validation rejects prices < 100 or > 50,000. Addressed in Phase 1.

5. **GitHub Actions minutes exhaustion** — Puppeteer overhead (browser launch + Cloudflare challenge + page load = 30-90s/source) may push actual usage beyond the estimated 1,350 min/month and exceed the 2,000 min free tier. **Fix:** Minimize Puppeteer use (prefer API/fetch); add per-source 90s timeout; implement a "skip window" that drops Puppeteer-heavy sources when minutes used > 80% of free tier. Addressed in Phase 1 architecture.

## Implications for Roadmap

### Phase 1: Foundation & MVP (Weeks 1-2)

**Rationale:** Must establish schema, parser, and core scrapers before adding complexity. Kabum (fetch+Cheerio, no anti-bot) and Mercado Livre (official API) are the easiest sources — ship them first to validate the pipeline end-to-end.

**Delivers:** Working MVP with 2 retailers, interactive filter table, and automated cron scraping.

**Stack used:** Node.js 22, TypeScript 5, Cheerio 1.2 (Kabum), Playwright 1.60 (ML - official API), Zod 4 + Drizzle 0.45 + Neon, Fastify 5, Next.js 15 + shadcn/ui + TanStack Table 8, GitHub Actions.

**Features delivered:**
- Multi-retailer price display (Kabum + ML)
- Best price across sources
- **GPU filter** (primary differentiator)
- CPU filter + RAM filter + Brand filter + Price range slider
- Price sorting (ASC/DESC)
- Last-updated timestamp per product
- Responsive layout

**Architecture components built:**
- Monorepo scaffolding (pnpm workspaces)
- `scraper-core` shared utilities
- `scraper-kabum` (fetch + Cheerio)
- `scraper-mercado-livre` (official API)
- `parser-pipeline` (regex + validation layer)
- `schema` (Drizzle tables: products, notebooks, prices, **product_groups**, scrape_logs, parse_errors)
- `api-server` (Fastify: list + detail endpoints)
- `frontend` (Next.js: table, filters, detail sheet)
- `.github/workflows/scrape-scheduled.yml`

**Pitfalls prevented:**
- #2 Spec parser degradation (test suite + validation layer)
- #3 Duplicate detection (product_groups schema)
- #4 Price history gaps (per-source timeout + scrape_logs)
- #7 Brazilian price formatting (dedicated parser + unit tests)
- #8 No graceful degradation (per-source try/catch + error isolation)
- #9 Spec normalization (CPU/RAM/storage normalization at parse time)
- #10 Price fluctuation (30-day stats in schema, no connected-line charts across gaps)

**Research flag:** LOW — well-established patterns (CRUD API, scraper + parser + frontend). Skip `/gsd-research-phase`.

### Phase 2: Depth & Cloudflare Sources (Weeks 3-4)

**Rationale:** Pichau and Terabyte require Playwright + stealth, which significantly increases GHA minute consumption and anti-bot complexity. Must be tackled after MVP is stable. Price history and storage/OS filters depend on the foundation built in Phase 1.

**Delivers:** Full source coverage (5 retailers), price history chart, storage/OS filters, product deduplication.

**Stack additions:** Playwright 1.60 stealth for Pichau/Terabyte/Magalu.

**Features delivered:**
- Pichau, Terabyte, Magalu scrapers (Playwright + stealth)
- Price history chart (`GET /prices/:id`)
- Detail sheet (shadcn Sheet with full specs)
- Storage type/size filter (SSD vs HD, 256/512/1TB)
- Operating system filter
- Price trend indicator ("Subiu 5% em 7 dias")
- Gamer/Office auto-classification
- **Fuzzy matching pipeline** for `product_groups` deduplication
- CPU generation indicator (13th gen, 14th gen)
- Deal/Oferta badge based on price delta

**Pitfalls prevented:**
- #1 Cloudflare on Pichau/Terabyte (Playwright + stealth, NOT Cheerio)
- #5 GHA minutes exhaustion (add budget monitor + skip window)
- #6 Source structure changes (golden file tests + min-count assertions)

**Research flag:** MEDIUM — Cloudflare anti-bot evasion requires local testing before GHA deploy. Use `/gsd-research-phase` to test Playwright stealth against Pichau/Terabyte before committing the scraper.

### Phase 3: Scale & Premium Features (Future)

**Rationale:** Americanas (Cloudflare-heavy) and Amazon BR (PA-API with rate limits) require the most sophisticated scraping. Side-by-side comparison and screen specs are complex UX that only make sense after the core product is validated.

**Delivers:** Full retailer coverage, advanced comparison tools, coupon integration.

**Features delivered:**
- Americanas scraper (Playwright + heavy anti-detection tuning)
- Amazon BR (PA-API with rate limit management)
- Manufacturer sources (Dell, Avell, Acer direct pages)
- Side-by-side comparison dialog (2-3 products)
- Screen specs filter (resolution, refresh rate)
- Best value score (specs/price ratio)
- Coupon/discount code display
- Link to YouTube reviews per model
- Price drop alert (URL-based, no login)

**Research flag:** HIGH — Amazon PA-API needs research; Americanas Cloudflare evasion may require proxy rotation. Use `/gsd-research-phase` for each sub-component.

### Phase Ordering Rationale

- **Parser first, scrapers second.** The spec parser is the highest-risk component and the basis for all differentiators. Building it alongside the first (easiest) scraper lets you iterate parsing logic without the overhead of anti-bot complexity.
- **Easiest sources first.** Kabum (no anti-bot) and ML (official API) can be built in days. Tackling Pichau/Terabyte (Cloudflare) in Phase 1 would delay the MVP by 1-2 weeks.
- **Schema completeness in Phase 1.** `product_groups` and `scrape_logs` tables must exist from the start because adding them later requires migrations on a live database. The matching logic can ship in Phase 2, but the schema must be ready.
- **Price history after scraping stabilizes.** You can't build reliable charts until the scraper pipeline is proven consistent over multiple cycles.

### Research Flags

**Needs deeper research during planning:**
- **Phase 2 (Cloudflare scrapers):** Test Playwright stealth against Pichau and Terabyte locally before committing. The anti-bot landscape evolves rapidly — what works today may need tuning by implementation time.
- **Phase 3 (Amazon BR PA-API):** Need to register Amazon Associates account, understand rate limits (1 req/s free tier), and verify data quality returned by the API.
- **Phase 3 (Americanas):** Heavy Cloudflare — may require rotating proxies or alternative strategy if Playwright alone is insufficient.

**Standard patterns (skip research-phase):**
- **Phase 1 (MVP):** CRUD API, Next.js frontend, Drizzle schema, GitHub Actions cron — all well-documented, established patterns. No research needed.
- **Phase 1 (parser regex):** Brazilian notebook title patterns are observable. Build test suite from actual titles at Kabum + ML.
- **Phase 1 (price normalization):** Brazilian locale edge cases are well-documented. Unit test coverage handles this.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Playwright > Puppeteer confirmed by abandoned stealth plugin. Fastify 5 stable. Drizzle 0.45 production-ready. Neon free tier sufficient for estimated volume. |
| Features | HIGH | Direct observation of 4 competitors (Zoom, Buscapé, Bench Promos, ML). GPU+CPU+RAM combined filter confirmed as gap in Brazilian market. Feature dependencies mapped and validated. |
| Architecture | HIGH | Strategy Pattern per-source, Pipeline Pattern for parser, append-only time-series prices — all well-established in scraping systems. Anti-patterns documented with alternatives. |
| Pitfalls | HIGH | Live HTTP probes confirmed Cloudflare on Pichau/Terabyte. Brazilian price formatting and title inconsistency patterns verified against actual listings. GHA minute estimates conservative. |
| **Overall** | **HIGH** | All major risk areas identified with mitigation strategies. No critical unknowns — only site-specific anti-bot tuning that must be verified locally before Phase 2. |

### Gaps to Address

- **Puppeteer vs. Playwright final decision:** STACK.md strongly recommends Playwright over Puppeteer (stealth plugin abandoned). PROJECT.md mentions Puppeteer. **Resolution:** Adopt Playwright as default; only use Puppeteer 22 if a specific stealth evasion technique requires it. Update PROJECT.md accordingly.
- **Zod v4 compatibility:** drizzle-zod 0.8.3 supports Zod v4 per peer dependency spec, but this is recent. **Fallback:** Pin to Zod 3.x if integration issues arise.
- **Fastify + Vercel deployment:** @fastify/vercel has confirmed limitations (cold start, no WebSocket). **Resolution:** Deploy Fastify on Render/Railway free tier. Frontend stays on Vercel. This split adds a CORS configuration step.
- **Caching strategy for price history charts:** At 360+ data points per product (6h × 90 days), rendering all points on a chart will be slow. **Resolution:** Aggregate to daily min/max/avg for >30-day views. Full precision only for 7-day view.
- **Product deduplication accuracy:** Fuzzy matching (brand + CPU + RAM + storage) is heuristic. Some false positives/negatives are inevitable. **Resolution:** Include a manual merge option in the future, and accept edge cases for MVP.

## Sources

### Primary (HIGH confidence)
- **npm registry** — version verification for all packages (2026-05-12)
- **Live HTTP probes** (2026-05-12) — curl tests confirmed Cloudflare on Pichau, Terabyte; Kabum SSR; ML API accessible
- **Direct competitor observation** (2026-05-12) — Zoom, Buscapé, Bench Promos, ML feature sets
- **PROJECT.md** — project scope, constraints, out-of-scope items
- **Official docs:** Fastify ([fastify.dev](https://fastify.dev)), Drizzle ([orm.drizzle.team](https://orm.drizzle.team)), Neon ([neon.tech](https://neon.tech)), Playwright ([playwright.dev](https://playwright.dev)), shadcn/ui ([ui.shadcn.com](https://ui.shadcn.com))

### Secondary (MEDIUM confidence)
- **Mercado Livre Developers Portal** — API documentation for official search endpoint
- **Amazon PA-API documentation** — rate limits (1 req/s) and data availability
- **puppeteer-extra-plugin-stealth** — v2.11.2, last published 2022 (abandoned status confirmed)
- **drizzle-zod peer dependencies** — confirms Zod v4 compatibility: `^3.25.0 || ^4.0.0`

### Tertiary (LOW confidence)
- **Cloudflare evasion tactics** — landscape evolves rapidly; Playwright stealth configurations may need adjustment by Phase 2 implementation
- **GHA minute consumption estimate** — 1,350 min/month is a projection; actual consumption depends on number of sources, retry frequency, and Cloudflare challenge duration

---

*Research completed: 2026-05-12*
*Ready for roadmap: yes*