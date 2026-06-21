# Phase 1: Scraper Core & Specs ETL - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish local scraper executable compiling validated CPU and GPU specifications into `produtos.json` from Pichau and Terabyte. Scraper must be modular to easily support additional retailers in the future.

</domain>

<decisions>
## Implementation Decisions

### Scraper Architecture & Runtime
- **D-01:** Scraper runs locally on Bun runtime using TypeScript.
- **D-02:** Use a modular design where each retailer has its own class/module conforming to a common extractor interface.
- **D-03:** Use Playwright for dynamic elements (lazy-loaded prices/specs) and Cheerio for high-performance static parsing.

### Validation & ETL
- **D-04:** Use Zod schemas to clean, validate, and normalize product data (CPUs and GPUs).
- **D-05:** Price strings must be parsed into clean float numbers (separating cash price and installment options).
- **D-06:** Technical specifications (such as socket names AM4/AM5/LGA1700 and GPU chipsets RTX 4060/RX 7600) must be normalized to standard lowercase/uppercase values.

### Outputs
- **D-07:** Output must be a consolidated `produtos.json` file written to a directory accessible by the frontend.

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
- Automated deployment & production JSON optimizations — Phase 3

</deferred>

---

*Phase: 01-scraper-core-specs-etl*
*Context gathered: 2026-06-21*
