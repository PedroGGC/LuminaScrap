# Phase 1: Scraper Core & Specs ETL - Research

**Researched:** 2026-06-21
**Domain:** E-commerce Web Scraper with Playwright, Cheerio, and Zod in Bun
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Scraper runs locally on Bun runtime using TypeScript.
- Modular design where each retailer has its own class/module conforming to a common extractor interface.
- Use Playwright for dynamic elements (lazy-loaded prices/specs) and Cheerio for high-performance static parsing.
- Use Zod schemas to clean, validate, and normalize product data (CPUs and GPUs).
- Price strings must be parsed into clean float numbers (separating cash price and installment options).
- Technical specifications (such as socket names AM4/AM5/LGA1700 and GPU chipsets RTX 4060/RX 7600) must be normalized to standard lowercase/uppercase values.
- Output must be a consolidated `produtos.json` file written to a directory accessible by the frontend.

### the agent's Discretion
- Code folder structure inside `scraper/`.
- Concurrency levels and random delay intervals to avoid retailer IP blocks.
- Exact regular expressions used in string cleaning/formatting.

### Deferred Ideas (OUT OF SCOPE)
- Next.js frontend website design & client-side filtering — Phase 2
- Automated deployment & production JSON optimizations — Phase 3

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

Single-tier application — all capabilities reside in Browser/Client/Local scripts.

</architectural_responsibility_map>

<research_summary>
## Summary

Researched modern web scraping techniques optimized for Bun, utilizing Playwright for dynamic browser automation and Cheerio for high-performance static DOM extraction. The research covers anti-bot evasion strategies, Zod validation pipelines, and data normalization techniques for hardware aggregates.

Key finding: To scrape Pichau and Terabyte reliably without Cloudflare blocks, we should run the browser in headful mode locally, or use realistic user-agents and play/pause delay strategies. Parsing prices requires robust regex targeting the Brazilian Real (BRL) currency format, distinguishing cash discounts from installment plans.

**Primary recommendation:** Build a unified CLI engine in Bun that invokes separate extractor modules. Each extractor returns raw JSON parsed by a Zod schema that handles normalization via pre-transforms.

</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| playwright | 1.44.0 | Dynamic browser automation | Best automation library, works natively in Bun |
| cheerio | 1.0.0-rc.12 | Fast static DOM parsing | Lightweight, jQuery-like API, extremely fast |
| zod | 3.23.8 | Data validation and cleaning | Strong TS type inference, rich schema transformations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| commander | 12.1.0 | CLI interface parsing | Defining tasks, scraper routes, and dry-runs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Puppeteer | Playwright is faster and has better TS/Bun support |
| Zod | ArkType / Valibot | Zod has more mature ecosystem and transformer features |

**Installation:**
```bash
bun add playwright cheerio zod commander
bunx playwright install chromium
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
scraper/
├── src/
│   ├── index.ts          # CLI Entrypoint
│   ├── extractors/       # Retailer extractors (Pichau, Terabyte)
│   │   ├── base.ts       # Extractor interface/base class
│   │   ├── pichau.ts     # Pichau extractor logic
│   │   └── terabyte.ts   # Terabyte extractor logic
│   ├── schemas/          # Zod validation & ETL schemas
│   │   ├── hardware.ts   # CPU/GPU schemas & normalizers
│   │   └── product.ts    # Base product schema
│   └── utils/            # Helper utils (regex, delay, file writer)
```

### Pattern 1: Modular Retailer Extractor
**What:** Define a common interface for extractors so the engine can run them polymorphically.
```typescript
export interface Extractor {
  name: string;
  scrape(): Promise<RawProduct[]>;
}
```

### Pattern 2: Zod Pre-Transformation and Normalization
**What:** Validate and normalize data in a single step using Zod's `preprocess` and `transform`.
```typescript
import { z } from 'zod';

export const PriceSchema = z.string().transform((val) => {
  // Clean currency formatting "R$ 1.234,56" -> 1234.56
  const clean = val.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(clean);
});

export const CpuSchema = z.object({
  name: z.string(),
  priceCash: PriceSchema,
  priceInstallment: PriceSchema,
  socket: z.string().transform((val) => {
    const match = val.match(/AM4|AM5|LGA\s*1700|LGA\s*1200/i);
    return match ? match[0].toUpperCase().replace(/\s+/g, '') : 'UNKNOWN';
  }),
});
```

### Anti-Patterns to Avoid
- **Hardcoded Selectors:** Storing selectors directly in the scrape loops. Keep them in configurations.
- **Single Monolithic Script:** Scrape logic, cleaning, and storage in a single `index.ts` makes adding retailers difficult.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI parsing | Custom process.argv parsing | Commander.js | Flag validation, help menus, auto-generated documentation |
| Data validation | Complex if/else schema checks | Zod | Robust validation, strict typing, error handling |
| HTML parsing | Custom regex string searches | Cheerio / Playwright locator | DOM query selectors are robust against layout shifts |

</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Cloudflare / Anti-Bot Block
**What goes wrong:** Retailer blocks request with 403 or forces JS/CAPTCHA challenges.
**Why it happens:** Playwright runs in headless mode with standard fingerprint.
**How to avoid:** Use headful mode when running locally, configure realistic user agents, and add random pauses.
**Warning signs:** Playwright timeouts, empty page loads, or Cloudflare challenge pages appearing.

### Pitfall 2: Memory Leak in Playwright
**What goes wrong:** System memory is exhausted when crawling multiple pages.
**Why it happens:** Browser contexts or pages are not closed properly after scraping.
**How to avoid:** Use `finally` blocks to guarantee browser/context shutdown.

</common_pitfalls>

<code_examples>
## Code Examples

### Standard Scraper Extractor Base Class
```typescript
import { chromium, Browser } from 'playwright';

export abstract class BaseExtractor {
  protected async getBrowser(): Promise<Browser> {
    return await chromium.launch({ headless: false }); // headful for anti-bot
  }
}
```

### Safe Playwright Cleanup Pattern
```typescript
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(url);
  // scrape
} finally {
  await browser.close();
}
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer | Playwright | 2023 | Playwright is faster and has native TS support |

</sota_updates>

<sources>
## Sources

### Primary (HIGH confidence)
- Playwright documentation (playwright.dev)
- Zod documentation (zod.dev)
- Cheerio documentation (cheerio.js.org)

</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Bun, Playwright, Cheerio, Zod
- Ecosystem: TS scripting, e-commerce web scraping
- Patterns: Modular extractors, Zod data normalizers

**Confidence breakdown:**
- Standard stack: HIGH - industry standard scraper libraries
- Architecture: HIGH - modular design is scalable

**Research date:** 2026-06-21
**Valid until:** 2026-07-21
</metadata>

---

*Phase: 01-scraper-core-specs-etl*
*Research completed: 2026-06-21*
*Ready for planning: yes*
