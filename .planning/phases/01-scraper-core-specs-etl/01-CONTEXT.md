# Phase 1: Scraper Core & Specs ETL - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish local scraper executable compiling validated CPU and GPU specifications into `produtos.json` from Tier 1 (KaBuM!, Pichau, Terabyte) and Tier 2 (Bench Promos) sources. Scraper must be modular to easily support additional retailers (like Tier 3) in the future.

</domain>

<decisions>
## Implementation Decisions

### Scraper Architecture & Runtime
- **D-01:** Scraper runs locally on Bun runtime using TypeScript.
- **D-02:** Use a modular design where each retailer has its own class/module conforming to a common extractor interface.
- **D-03:** Use Playwright (with Stealth plugins: playwright-extra + puppeteer-extra-plugin-stealth) and Cheerio for robust extraction.

### Validation & ETL
- **D-04:** Use Zod schemas to clean, validate, and normalize product data (CPUs and GPUs).
- **D-05:** Price strings must be parsed into clean float numbers (separating cash price and installment options).
- **D-06:** Technical specifications must be normalized, excluding invalid terms ("usado", "caixa", "kit upgrade", "defeito") and identifying white-label/Chinese hardware brands.
- **D-07:** Output must be a consolidated `produtos.json` file.

### Multi-Tier Crawling Architecture
- **D-08:** Implement crawlers spanning initial tiers:
  - **Tier 1:** KaBuM! (React backend API interception), Pichau (Playwright dynamic cards), and Terabyte (Cheerio/Playwright hybrid).
  - **Tier 2:** Bench Promos (Affiliate URL resolver).

### the agent's Discretion
- Code folder structure inside `scraper/`.
- Concurrency levels and random delay intervals to avoid retailer IP blocks.
- Exact regular expressions used in string cleaning/formatting.

</decisions>

<specifics>
## Specific Ideas

- CLI command should run simply as `bun run scrape` or similar.
- Store selector configurations separately from logic so updates to site templates can be adjusted in a config file without refactoring the crawler logic.

</specifics>

<canonical_refs>
## Canonical References

### Project Scope & Stack
- `.planning/PROJECT.md` — Project context and business rules
- `.planning/research/STACK.md` — Recommended versions and technology constraints
- `.planning/research/FEATURES.md` — MVP requirements and prioritization matrix
- `.planning/research/ARCHITECTURE.md` — System design and data flow diagrams
- `.planning/research/PITFALLS.md` — Anti-bot protection details and formatting traps

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (Greenfield project).

</code_context>

<deferred>
## Deferred Ideas

- Next.js frontend website design & client-side filtering — Phase 2
- Tier 3 Mass & Global Marketplaces (Mercado Livre, Amazon, Shopee, AliExpress) — Phase 3 (postponed due to complexity)
- Automated deployment & production JSON optimizations — Phase 3

</deferred>

---

*Phase: 01-scraper-core-specs-etl*
*Context gathered: 2026-06-21*
