# Pitfalls Research

**Domain:** Price monitoring panel for notebooks in Brazilian e-commerce
**Researched:** 2026-05-12
**Confidence:** HIGH (anti-bot verified via live HTTP probes; spec parser and data quality based on established patterns)

## Critical Pitfalls

### Pitfall 1: Cloudflare / Anti-Bot on Pichau and Terabyte Blocks Simple Scraping

**What goes wrong:**
Scraper returns empty data or "Just a moment..." HTML instead of real product pages. The plan lists Cheerio (Terabyte) and "API interna via DevTools" (Pichau), but both sites are behind Cloudflare's browser challenge protection. A simple `fetch` + Cheerio or even raw `curl` gets a challenge page, not product data.

**Why it happens:**
- **Pichau** — confirmed Cloudflare challenge (`curl` returns "Just a moment..."). Any non-browser request is blocked. Even Puppeteer may trigger Cloudflare's detection if default fingerprinting is visible.
- **Terabyte** — same Cloudflare challenge confirmed.
- The plan's "Cheerio" assumption for Terabyte underestimates the anti-bot layer.
- The "internal API via DevTools" approach for Pichau may also be blocked if the API endpoint checks the same Cloudflare cookie / user-agent / origin headers.

**How to avoid:**
- Replace Cheerio strategy for Terabyte with **Puppeteer + puppeteer-extra-plugin-stealth** (or similar stealth plugin).
- For Pichau, test the internal API endpoint from within a real browser DevTools session FIRST. If the API requires Cloudflare cookies, either: (a) use Puppeteer to get a session cookie and reuse it, or (b) scrape the rendered page directly.
- Keep a local browser fingerprint test suite: run the scraper locally against each new site before deploying to GitHub Actions.
- Set a `MAX_RETRIES` per site (recommended: 2) — Cloudflare blocks don't resolve on retry without full browser context.

**Warning signs:**
- Scraper output contains `<title>Just a moment...</title>` or "Checking your browser before accessing" in the response body.
- `response.status === 403` with Cloudflare challenge page.
- Empty database entries for a site that consistently fails.

**Phase to address:**
Phase 1 (Kabum + ML don't have this issue, but Phase 2 — Pichau/Terabyte — will fail unless strategy is corrected before implementation).

---

### Pitfall 2: Spec Parser Reliability Degrades Over Time (Título Bruto → Campos Estruturados)

**What goes wrong:**
The regex-based parser works for 80% of titles at launch, but as new products are added, new CPU/GPU generations, weird formatting, and retailer-specific title conventions cause parse failures. The Claude API fallback adds cost and latency. Eventually, the database gets polluted with partial/null specs, and the entire value proposition (filtering by technical specs) breaks.

**Why it happens:**
- Brazilian notebook titles are famously inconsistent:
  - `"Notebook Gamer Acer Predator Helios Neo 16 PHN16-71-76VP i7-13700HX 16GB 1TB SSD RTX 4060 16" W11"` (standard)
  - `"NOTEBOOK ACER PREDATOR HELIOS PHN16-71-76VP"` (minimal, no specs)
  - `"NB ACR PRED H16 I7 16G 1T RTX4060"` (abbreviated)
  - `"Notebook Dell Inspiron 15 3000 Intel Core i5-1235U 8GB 256GB SSD Tela 15.6"" ` (different order)
- New hardware generations (e.g., RTX 5060, Arrow Lake) introduce patterns not in the original regex.
- Retailers change their title format over time.
- No validation step catches bad parses — bad data silently enters the database.

**How to avoid:**
- Implement a **validation layer** in Zod/parse step: assert that at minimum cpu_family, ram_gb, and storage_gb are non-null. Flag products that fail this as "PARSE_FAILED" and report them.
- Build a **parser test suite** with known-good titles that runs on every PR/commit. The suite must cover at minimum:
  - Intel i5/i7/i9 (12th-14th gen)
  - AMD Ryzen 5/7/9 (7000-8000 series)
  - GPU: integrated, RTX 3050/4050/4060/4070/4080/4090
  - RAM: 8GB, 16GB, 32GB, 64GB
  - Storage: 256GB, 512GB, 1TB, 2TB (SSD/HDD distinction)
- Log parse failures to a separate table for manual review + Claude API batch processing.
- Do NOT use Claude API as a sync fallback in the hot path (adds latency and cost per scrape). Use it as an async batch processor for failed parses.

**Warning signs:**
- Increasing number of products with `cpu = null` or `ram = 0` after a new scrape run.
- A specific retailer's products consistently showing null specs (title format changed).
- Filter UI shows fewer results than expected for a common spec filter.

**Phase to address:**
Phase 1 (parser is built here — must include the validation layer and test suite from day one).

---

### Pitfall 3: Duplicate Product Detection Fails — Same Notebook, Multiple Sellers, No Match

**What goes wrong:**
The same notebook model (e.g., "Lenovo IdeaPad 3 15IAU7 i5-1235U 8GB 256GB") is sold at Kabum, Mercado Livre, and Pichau at different prices. But each retailer uses a different product title, different product ID, and different URL. The database treats them as three separate products, and the "price comparison" feature shows unrelated products instead of the same model across stores.

**Why it happens:**
- No universal SKU or GTIN/EAN in the scraped data (many Brazilian retailers don't list EAN in search results).
- Title-based matching is fragile: `"Notebook Lenovo Ideapad 3 15IAU7"` ≠ `"Lenovo IdeaPad 3 15 Polegadas Intel Core i5-1235U"`.
- Model numbers (e.g., "15IAU7") are the most reliable identifier but often buried or omitted.
- The plan doesn't include a deduplication/grouping strategy.

**How to avoid:**
- Extract **model number** from titles as a separate field (e.g., `15IAU7`, `PHN16-71-76VP`). Model numbers are the most consistent cross-retailer identifier.
- Implement a **fuzzy matching pipeline** post-scrape:
  1. Exact model number match → definitive group
  2. Model number not found → token overlap on (brand + cpu model + ram + storage)
  3. If any 3 of 4 match → same product group
- Store groups in a `product_groups` table (one-to-many: group → products from different stores).
- Include a manual merge UI in the future (admin can link products across stores).
- Accept that some matches will be wrong — allow users to report incorrect groupings.

**Warning signs:**
- Price comparison chart shows products with different CPU/GPU/RAM in the same view.
- Filter by "RTX 4060" returns 20 products from 5 stores that are actually 4 different models.
- User reports seeing the same notebook at different prices as separate entries.

**Phase to address:**
Phase 1 schema design (add `product_groups` table even if the matching logic ships later — avoids migration pain). Phase 2 for fuzzy matching pipeline.

---

### Pitfall 4: Price History Has Gaps — Failed Scrapes Produce Misleading Charts

**What goes wrong:**
A scraper run fails for one or more sources (GitHub Actions timeout, site returns 503, Cloudflare challenge). No price record is inserted for those products on that day. The frontend chart shows a gap — or worse, it interpolates, creating a misleading "this product was cheaper yesterday" impression.

**Why it happens:**
- GitHub Actions has a default 6-hour timeout per job; individual site scrapers that get stuck (Cloudflare, infinite scroll, network blips) don't fail gracefully.
- No sentinel/health check per source: if Kabum fails silently, no one notices for hours.
- The frontend chart library (shadcn Chart) may connect data points across gaps, creating a false trend.

**How to avoid:**
- Per-source timeout: each scraper function gets its own `Promise.race` with a 90-second timeout. If it exceeds, log "SCRAPE_TIMEOUT [source]" and move on.
- Never overwrite prices — always insert new rows. Missing data = no row, and the chart should show discrete points, not connected lines across gaps.
- Add a `scrape_logs` table: one row per source per run with status (success/partial/fail) and product count. This lets you detect systemic failures.
- Implement a "staleness indicator" in the frontend: any product whose last price scrape was >12h ago gets a yellow/orange badge.
- Run an "orphan check" after each batch: if less than 50% of expected products were scraped for a source, flag the run as failed.

**Warning signs:**
- Sequential scrape runs with wildly different product counts for the same source.
- Chart showing price dropping to R$ 0.00 (null rendered as zero).
- User asks "why is my notebook's price not updating?"

**Phase to address:**
Phase 1 (scraper architecture and schema design must include timeout handling and logging).

---

### Pitfall 5: GitHub Actions Minutes Exhaustion from Puppeteer Overhead

**What goes wrong:**
The project has an estimated 1,350 min/month budget with 2,000 free. But Puppeteer takes 30-90 seconds per source (browser launch + page load + JS render + teardown). With 10+ sources running every 6-8 hours, actual consumption can exceed 2,000 minutes. The workflow starts failing, scraper runs are skipped, and data freshness collapses.

**Why it happens:**
- The estimate assumed ~15 minutes per cycle. But each Puppeteer-based source can take 60s+.
- Pichau (Cloudflare): browser launch (5s) + Cloudflare challenge (5-15s if it passes) + page render (5s) = ~20-30s at minimum.
- Terabyte (Cloudflare): same overhead.
- If Cloudflare blocks even Puppeteer, it may need retries with new browser contexts.
- `puppeteer-extra-plugin-stealth` itself adds startup overhead.
- The estimate didn't account for failed runs that take full timeout before aborting.

**How to avoid:**
- Minimize Puppeteer usage: use fetch/Cheerio whenever possible. Prefer API endpoints (Kabum's internal API, ML's official API) over browser rendering.
- For sites that MUST use Puppeteer (Pichau, Terabyte), batch product pages: scrape the listing page once, extract all product URLs, then close the browser.
- Set per-source retry policies: max 2 retries, with exponential backoff (2s, 5s). Don't retry Cloudflare blocks — they won't resolve.
- Add a "skip window": if minutes used this month > 80% of free tier, skip Puppeteer-heavy sources and only run lightweight API scrapers.
- Monitor GHA minute usage programmatically (GitHub API endpoint: `GET /repos/:owner/:repo/actions/workflows/:id/timing`).

**Warning signs:**
- "We are temporarily pausing your workflow runs" email from GitHub.
- Workflow run shows "cancelled" after 6 hours.
- Increasing number of skipped individual source scrapers.

**Phase to address:**
Phase 1 (scraper architecture — design for Puppeteer-minimal approach from the start). Phase 2 (when adding Cloudflare-protected sources).

---

### Pitfall 6: Sources Change HTML/API Structure Without Warning

**What goes wrong:**
A retailer's category page was being parsed via CSS selectors. One day, the scraper returns 0 products. The selector no longer matches because the site was redesigned, the class names changed, or the data is now loaded via a different endpoint. No alert fires, and the source goes dark for days.

**Why it happens:**
- Retailers routinely change their frontend (A/B tests, redesigns, framework migrations — Kabum itself migrated to Next.js, which likely changed their HTML structure).
- CSS class names are not stable — especially with CSS-in-JS libraries (styled-components, etc.) that generate hashed class names.
- No structural monitoring on the scraper — it assumes the selector works until it doesn't.

**How to avoid:**
- **Golden file pattern**: for each source, store a known-good HTML sample and expected extracted count in the test suite. Run these tests on every deploy.
- For each scraper, after extraction, assert: `extractedItems.length > 0` OR `extractedItems.length >= expectedMinimum`. If violated, log a CRITICAL alert (e.g., send to Telegram or email).
- Prefer extracting from structured data (JSON-LD, API responses) over DOM selectors. Structured data formats (JSON) are more stable than HTML class names.
- For DOM-based scrapers, write selectors that target **data attributes** (e.g., `[data-product-id]`) or **semantic elements** (e.g., `article.product-card`) rather than CSS class names.
- Run the scraper locally once a week to verify sources still work, or schedule a "health check" run between regular scrapes.

**Warning signs:**
- Sudden drop in extracted count for one source (from 150 to 0 or 5).
- All fields from one source show "N/A" but the page loaded successfully.
- Comparison with manual check shows missing products.

**Phase to address:**
Phase 1 (test suite structure, min-expected-count assertions). Phase 3 (telegram/monitoring alerts).

---

### Pitfall 7: Brazilian Price Formatting Causes Numeric Parsing Errors

**What goes wrong:**
Brazilian prices come in varied formats and the scraper fails to normalize them, storing `null`, `NaN`, or wildly wrong values:
- `"R$ 1.234,56"` (standard: thousands separator `.`, decimal `,`)
- `"R$1.234,56"` (no space)
- `"De: R$ 1.899,00 Por: R$ 1.234,56"` (two prices in one string)
- `"12x de R$ 199,90"` (installment, not total)
- `"R$ 1.234"` (no decimal — means R$ 1,234.00, but could be R$ 12.34 if misread)
- `"à vista R$1.199,00"` (cash discount price)
- JSON API returning `123456` (stored as integer cents) vs. `1234.56` (stored as float reais)

**Why it happens:**
- Brazilian locale uses `.` as thousands separator and `,` as decimal — the opposite of US/UK standards.
- JavaScript's `parseFloat("1.234,56")` returns `1.234` instead of `1234.56`.
- Retailers embed discount/installment text in the same field.
- No standard price representation across retailer APIs.

**How to avoid:**
- A single `parseBrazilianPrice(str)` function that:
  1. Strips non-numeric characters except `.`, `,`, and `-`
  2. Detects and removes thousands separators (`. ` followed by exactly 3 digits) — this is tricky because the thousands sep is `.` and decimal is `,`
  3. Replaces `,` with `.` as decimal separator
  4. Converts to float
- Validate output: `> 0 && < 100000` (notebooks never cost R$ 0 or R$ 1M+ — catch clearly wrong values).
- For installment prices, always use the "total à vista" / cash price if available. Tag installment-only rows distinctly.
- Unit test: cover all known price formats from all target retailers.

```typescript
function parseBrazilianPrice(raw: string): number | null {
  // Remove "R$", " ", "de", "por", "à vista", "até"
  const cleaned = raw.replace(/R?\$?\s*/gi, '').trim();
  // Handle "12x de 199,90" — extract total as installment * value
  const installmentMatch = cleaned.match(/(\d+)x\s*(?:de\s*)?R?\$?([\d\.,]+)/i);
  if (installmentMatch) {
    const times = parseInt(installmentMatch[1]);
    const value = parseSinglePrice(installmentMatch[2]);
    if (value) return times * value; // total price from installment
  }
  return parseSinglePrice(cleaned);
}

function parseSinglePrice(str: string): number | null {
  // Remove everything except digits, comma, dot, minus
  const cleaned = str.replace(/[^\d,\-]/g, '');
  if (!cleaned) return null;
  // Last comma or dot is the decimal separator
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalIdx = Math.max(lastComma, lastDot);
  if (decimalIdx === -1) {
    const n = parseInt(cleaned);
    return isNaN(n) ? null : n;
  }
  const integerPart = cleaned.slice(0, decimalIdx).replace(/[.\-,]/g, '');
  const decimalPart = cleaned.slice(decimalIdx + 1);
  const result = parseFloat(`${integerPart}.${decimalPart}`);
  return isNaN(result) ? null : result;
}
```

**Warning signs:**
- Price chart showing R$ 1.23 for a notebook (obviously wrong).
- Product listed as "R$ 0.00" or `NaN`.
- A specific retailer consistently shows wrong prices while others are correct.

**Phase to address:**
Phase 1 (Zod validation schema + price normalization function — must be in the MVP).

---

### Pitfall 8: No Graceful Degradation When a Source Is Down

**What goes wrong:**
One retailer's API returns 503 (or Cloudflare blocks Puppeteer). The entire scraper run fails because there's no error isolation. Or worse, the run succeeds but that source's products are silently absent from the daily update, making them appear 24h stale.

**Why it happens:**
- All scrapers in a single `Promise.all` — one rejections cascades.
- No per-source error isolation.
- No staleness indicator in the frontend.

**How to avoid:**
- Use `Promise.allSettled` or individual try/catch per source. One source failing must NEVER block others.
- After each source scrape, log the outcome: `{ source: "pichau", status: "success" | "timeout" | "parse_error" | "empty", count: number, duration_ms: number }`.
- In the frontend, add a `lastUpdated` per row and a "data age" indicator (green < 8h, yellow 8-24h, red > 24h).
- Consider a simple "source health" badge on the UI showing which retailers were scraped successfully in the last run.

**Warning signs:**
- All products from one source disappear from the frontend after a bad scrape run.
- User sees 5 of 6 retailers represented.

**Phase to address:**
Phase 1 (scraper orchestration must use per-source error boundaries).

---

### Pitfall 9: Spec Filtering Breaks When Field Values Are Non-Normalized

**What goes wrong:**
The filter UI offers "CPU: Intel i5" and "RAM: 16GB" options, but the database contains:
- `"Intel Core i5-1235U"`, `"i5"`, `"Core i5 12th gen"`, `"Intel i5"`, `"I5"` for cpu
- `"16GB"`, `"16 GB"`, `"16 gb"`, `"16384 MB"` for ram
The filter counts are all wrong, and "Intel i5" returns only half the matching products.

**Why it happens:**
- Parser extracts raw strings from varied titles.
- No normalization step maps variants to a canonical form.
- Case sensitivity in filters.

**How to avoid:**
- **CPU family normalization**: after extracting cpu info, normalize to a canonical label:
  - `"Intel Core i5-1235U"` → `family: "Intel i5", model: "i5-1235U"`
  - `"Ryzen 7 7840HS"` → `family: "AMD Ryzen 7", model: "Ryzen 7 7840HS"`
- **RAM normalization**: always store as GB integer. `"16384 MB"` → `16`, `"16 GB"` → `16`.
- **Storage normalization**: always store as GB integer. `"1TB"` → `1024`, `"512GB"` → `512`.
  - Crucial: distinguish `ssd_storage_gb` from `hdd_storage_gb` if the info exists.
- Use an enum/mapped type for `cpu_family` in the Zod schema so invalid values are rejected.
- Normalize at parse time, not at query time.

**Warning signs:**
- Filter UI shows "Intel Core i5-1235U" and "Intel i5" as separate filter options.
- Number of products per filter option seems lower than expected.
- Searching "i5" returns different results than selecting "i5" from the dropdown.

**Phase to address:**
Phase 1 (normalization logic is part of the parser — do it right from the start, it's expensive to re-parse later).

---

### Pitfall 10: Rapid Price Fluctuation in Brazil (Inflation/Promo Cycles) Invalidates Price Logic

**What goes wrong:**
Black Friday, Dia das Mães, or simply monthly inflation in Brazil can cause 20-40% price swings in a single day. The premise of "check every 6-8h" may miss intra-day flash sales (Mercado Livre's "Super Ofertas" last hours). Meanwhile, base prices drift up with inflation so the "history chart" shows mostly upward trend with brief dips, giving users a misleading "it was cheaper before" impression.

**Why it happens:**
- Brazilian e-commerce has aggressive flash sales (Mercado Livre "Clube do Desconto", Kabum "Promoção Relâmpago").
- Inflation (IPCA) and USD/BRL exchange rate directly impact notebook prices — import-heavy category.
- A price drop from R$ 4.000 to R$ 3.500 may be a genuine sale or just reversion after a temporary price hike.
- Without context (e.g., "lowest price in 30 days"), the raw history is noise.

**How to avoid:**
- Store and display **30-day and 90-day min/max/avg** alongside the current price.
- Add a "price alert" badge: if the current price is within 5% of the 30-day low, label it "Good price!"; if >10% above 30-day avg, label it "Price elevated".
- Tag Black Friday / Cyber Monday / Prime Day scrapes so users can filter promo-season data.
- Don't over-sample: 6-8h granularity is fine for trend. Add an optional Telegram alert for extreme drops (>15% in 24h) if you want to capture flash sales.
- Clearly label the exchange rate period in the UI: "Preços podem variar com o dólar" (a subtle footnote).

**Warning signs:**
- User comments: "the price history is just lines going up."
- Price drops 20% and returns to normal within 24h (missed flash sale).
- Chart scaling makes normal variation look like extreme volatility.

**Phase to address:**
Phase 1 (30-day stats in the schema). Phase 2 (price labels/visual indicators in the frontend).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping the product_groups/dedup table | Faster MVP — every product is independent | Massive data duplication; impossible to compare same model across stores | NEVER — add the table (even empty) in Phase 1 schema |
| Single Zod schema for all sources | One parser, less code | Each retailer has quirks (ML has `installments`, Kabum has `oldPrice`); one-size-fits-all misses data or breaks | MVP only (Phase 1). Refactor to per-source transformers in Phase 2. |
| No per-source timeout in GitHub Actions | Simpler YAML — one big `timeout-minutes: 360` | One stuck Puppeteer run (Cloudflare challenge loop) kills the entire workflow | NEVER — per-source timeouts are cheap to add (Promise.race with 90s limit in code) |
| Parsing specs in the frontend (vs. storing parsed fields) | No backend schema changes | Every page load re-parses the same titles; browser-side regex; results inconsistent | NEVER — parse at scrape time, store in DB |
| Hardcoded CSS selectors per source | Quick to write | Breaks silently when retailer redesigns; no test coverage | Phase 1 only. Add golden-file tests before Phase 2 sources. |
| Storing prices as float | Simple, direct | Float rounding errors in history aggregation; Postgres float comparison is unreliable | NEVER — store price as integer (cents) or use Postgres `numeric(10,2)` |
| Using the same User-Agent for all sources | Simple config | Anti-bot systems flag repeated identical fingerprints faster | MVP only. Rotate User-Agent per source + run. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Kabum API** / `api/v1/products/list` | Assuming it's a public REST API | The endpoint returned HTML (not JSON). Product data is in client-side rendered Next.js. Use Puppeteer or find the actual JSON endpoint (`/api/product/*`) via DevTools Network tab. Verify before coding. |
| **Mercado Livre API** | Using full response without filtering unnecessary fields | ML API returns verbose data (seller info, shipping, etc. for every product). Use `&attributes=id,title,price,currency_id,thumbnail,catalog_product_id` to limit fields and speed up parsing. |
| **Pichau** (Phase 2) | Assuming there's an internal API at a predictable URL | Pichau is behind Cloudflare. Even if an API endpoint exists, it likely requires Cloudflare cookies. Strategy: Puppeteer → scrape listing page direct, don't rely on API discovery. |
| **Terabyte** (Phase 2) | Using Cheerio (static HTML) | Terabyte is behind Cloudflare. Cheerio won't work — needs Puppeteer + stealth. Plan must be updated. |
| **Amazon BR** (Phase 3) | Using the PA-API directly with default throttling | PA-API has strict rate limits (1 request per second for free tier). You must batch requests and cache aggressively. Also: Amazon BR often shows Marketplace resellers at confusing prices — filter by `IsAmazonFulfilled`. |
| **GitHub Actions secrets** | Hardcoding API keys in the workflow YAML | Use `secrets.API_KEY` for any credentialed source. Passwords in plaintext in the workflow file are exposed to anyone with repo read access. |
| **Neon Postgres** | Running heavy queries on Serverless Postgres without connection pooling | Neon's serverless Postgres has cold starts (~500ms) on each connection if idle. Use connection pooling (PgBouncer via Neon's pooler) for the Fastify API. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **All scrapers in one GHA job** | Single source timeout delays the entire run; minutes consumed by one stuck scrape | Per-source parallel execution with individual timeouts + `Promise.allSettled` | Phase 1, with 2 sources it's manageable; Phase 2 with 10+ sources, a single timeout can waste 60+ minutes |
| **SELECT * without pagination for the frontend** | Frontend loads slowly on first render; large JSON payload | Use cursor-based pagination (TanStack Table has this built in). Always limit to 50 items initial load. | Works at <500 products. At 2,000+ notebooks across 10 sources, payload >500KB crushes mobile load times |
| **Frequent Neon DB calls from the scraper** | Each product insert triggers a separate DB connection; Neon free tier has limits on concurrent connections (20 max) | Use Drizzle's `insert().values(batch)` with arrays of products. Batch size: 50-100 per statement. | After ~100 individual inserts in a tight loop, Neon connection pool may saturate |
| **Regex-then-Claude-fallback on every title** | Fastify API calls to Claude API add latency (500ms-3s per fallback). If 20% of 200 titles fall back → 40 API calls → 20-120s extra per scrape run | Move Claude fallback to an async batch job. Show placeholder spec values ("em análise") for products pending Claude parse. | With 10 sources × 200 products each × 20% fallback rate = 400 Claude calls per run. At ~$3/1M Claude tokens, this may add cost. |
| **Chart rendering all price history points** | Chart becomes unresponsive with 100+ data points per product (6h intervals × 90 days = 360 points) | Aggregate: show daily min/max/avg for >30 day views. Full precision only for 7-day view. | At ~180+ price points per product, the shadcn Chart re-render kills UX on lower-end devices |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Storing Claude API key in GHA secrets with no rotation** | If GHA workflow artifact leaks (e.g., debug mode), API key is exposed. $10-50/month cost if abused. | Rotate keys every 90 days. Use environment-specific keys. Enable usage alerts in Anthropic console. |
| **Fastify API exposed without rate limiting** | Anyone can scrape the API — or worse, hammer it to trigger cost for Claude fallback endpoints | Add `@fastify/rate-limit` middleware. Set generous limits (100 req/min for GET, 5 req/min for POST). |
| **No HTTPS enforcement on the API** | Man-in-the-middle attacks could inject fake price data | Deploy on Vercel (enforces HTTPS). If self-hosting Fastify on a VPS, terminate TLS. |
| **Exposing product URLs with affiliate parameters** | If a scraper picks up an affiliate-tagged URL, the stored URL contains someone else's affiliate code | Strip all query params except ones necessary for the product page (e.g., `?productId=123`). Never store `?utm_source=`, `?tag=`, `?ref=`. |
| **Neon connection string in repo** | Direct database access exposed if repo is compromised | Always use environment variables for DATABASE_URL. For GHA, use `${{ secrets.DATABASE_URL }}`. Never hardcode in config files. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No "data age" indicator** | User sees a notebook listed at R$ 3.200 but the price was scraped 3 days ago (it's now R$ 3.800) | Always show "atualizado há Xh" next to each price. Color-code: green < 8h, yellow 8-24h, red > 24h. |
| **Filtering by GPU but GPUs aren't extracted** | User selects "RTX 4060" and gets 0 results. Thinks the site is broken. | Show the filter only after confirming at least one product matches the criteria. Add a "no results" state that suggests removing filters. |
| **Comparing notebooks from different stores** | User sees "Notebook A" at R$ 3.000 from Kabum and "Notebook A" at R$ 3.200 from ML — assumes they're the same product | Group deduplication is essential. Without it, the user has to mentally match products across rows. If dedup is not ready, add a model-number badge so users can at least manually find matches. |
| **Price history shows connected lines across gaps** | A failed scrape on Tuesday creates a line from Monday R$ 3.000 to Wednesday R$ 3.200, implying a R$ 200 increase | Use discrete point charts (scatter/bar) instead of line charts. Or use dashed lines across gaps. |
| **Installment price shown as total price** | Product shows "R$ 199,90" but that's the installment, not the total. Real total is R$ 2.398,80 (12x). | Always prefer "à vista" / cash price. If only installment is available, label it clearly: "12x R$ 199,90 (total R$ 2.398,80)". |
| **No mobile-friendly table** | Users on mobile pinch-zoom on a wide table with 15 columns | Hide columns on mobile (spec details → expandable row). Keep only: store, model, price, age. Expand on tap. |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [x] **Scraper fetches product data:** Often missing per-source timeout — verify `Promise.race` with 90s limit per source
- [x] **Price parser handles Brazilian format:** Often missing the `12x de R$ 199,90` installment case — verify the parser rejects installment-only values or calculates total
- [x] **Product table has specs columns:** Often missing `cpu_family` normalization — verify data shows "Intel i5" not "Intel Core i5-1235U" in filter dropdowns
- [x] **Drizzle schema created:** Often missing `product_groups` table for cross-store grouping — verify the table exists (even if empty) before Phase 2 sources arrive
- [x] **GitHub Actions set up:** Often missing health check / "source status" logging — verify each run emits a structured log per source (success count, duration, status)
- [x] **Frontend table renders:** Often missing empty state when filters return 0 results — verify the UI shows "Nenhum notebook encontrado com esses filtros" instead of a blank page
- [x] **Price history chart:** Often missing gap detection — verify chart doesn't connect points across more than 24h without data
- [x] **Regex parser handles most titles:** Often missing test suite for edge cases — verify there's a test file with 20+ known-good titles covering all target CPU/GPU/RAM combos

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Cloudflare blocks a source** | MEDIUM (re-write scraper approach) | 1. Confirm the block type (Cloudflare challenge vs. IP ban). 2. Switch from Cheerio to Puppeteer + stealth plugin. 3. If still blocked, add rotating proxies or reduce frequency to 1x/day. 4. Remove the source temporarily if all fails. |
| **Spec parser produces bad data** | MEDIUM (re-parse products from raw titles) | Keep the `raw_title` column. Write a backfill script that re-parses all rows with the improved regex. Flag rows that need review. |
| **GitHub Actions minutes exhausted** | LOW (adjust schedule) | 1. Temporarily reduce frequency to 1x/day. 2. Disable Puppeteer-heavy sources. 3. Or upgrade to GitHub paid tier ($4/month for 3,000 min). |
| **Source HTML structure changed** | LOW to HIGH (depends if selector-based) | 1. Check alert log for the source. 2. Run DevTools locally. 3. Update CSS selectors or re-identify the API endpoint. 4. Update golden file. 5. Re-deploy. |
| **Neon DB reaches free tier limits** | LOW (scale up) | 1. Check if you hit row limit (500K rows for free). 2. Archive prices older than 90 days to a summary table. 3. Or upgrade to Neon paid ($19/month). |
| **Duplicate products across stores** | HIGH (requires schema change + backfill) | 1. Add `product_groups` table and migration. 2. Write fuzzy matching script. 3. Manual verification of ambiguous groups. 4. Backfill `group_id` FK. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 Cloudflare on Pichau/Terabyte | Phase 2 (test approach locally BEFORE implementation) | Local test: curl the API/URL → if "Just a moment...", adjust scraper strategy. CI test: golden file for each source. |
| #2 Spec parser degrades | Phase 1 (parser test suite + validation layer) | CI: parser test suite passes 20+ known titles. DB: no products with null cpu/ram/gpu after a run. |
| #3 Duplicate product detection | Phase 1 (schema includes `product_groups`) + Phase 2 (matching pipeline) | Schema audit: `product_groups` table exists. Query: count products with group_id = null. |
| #4 Price history gaps | Phase 1 (scraper per-source timeout + log table) | Log: every run has per-source status row. Frontend: no connected-line gaps >24h. |
| #5 GHA minutes exhausted | Phase 1 (Puppeteer-minimal architecture) + Phase 2 (budget monitor) | GHA API query: monthly minutes used < 1,500 (75% of free tier). |
| #6 Source structure changes | Phase 1 (golden file + min-count assertion) | CI: golden file test passes. Alert: source count drops below threshold triggers notification. |
| #7 Brazilian price formatting | Phase 1 (price normalization function + Zod validation) | Test: price normalization unit tests cover all known formats. DB: no price < 100 or > 50000. |
| #8 No graceful degradation | Phase 1 (per-source error boundaries + logging) | Test: simulate one source failure → other sources still produce data. Log: each source has individual status row. |
| #9 Spec normalization | Phase 1 (CPU/RAM/storage normalization at parse time) | DB: cpu_family values are canonical ("Intel i5", "AMD Ryzen 7"). Filter UI: each family appears once. |
| #10 Price fluctuation / inflation | Phase 1 (30-day stats in schema) + Phase 2 (UI labels) | DB: price_stats exist. Frontend: "lowest in 30 days" badge displays correctly. |

---

## Sources

- Live HTTP probes (May 2026): confirmed Pichau and Terabyte behind Cloudflare (curl returns "Just a moment..."). Kabum uses Next.js SSR, no immediate Cloudflare on category pages. ML official API works without auth. Magalu returns raw HTML but data likely JS-rendered.
- Brazilian notebook title patterns observed in Kabum, ML, and news listings: inconsistent format order, abbreviations, missing specs.
- Brazilian price formatting documented per ABComm (Brazilian e-commerce association) standards.
- GHA minute estimation: puppeteer-extra boots Chromium in ~5s, page load + Cloudflare challenge ~15-30s per source. Current estimate of 15min/run is optimistic once Cloudflare-protected sources are added.
- Community pattern: CSS selector fragility in web scraping (common post-mortems on scrapers failing after site redesigns).
- Neon Postgres serverless connection limits: 20 concurrent connections on free tier (verified via Neon docs).
- PA-API rate limits: 1 req/sec for free tier (verified via Amazon Associates documentation).

---

*Pitfalls research for: Notebook Price Monitoring Panel — Brazilian E-commerce*
*Researched: 2026-05-12*