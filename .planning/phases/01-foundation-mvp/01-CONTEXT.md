# Phase 1: Foundation & MVP - Context

**Gathered:** 2025-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete MVP pipeline: scraper → parser → database → API → frontend. Users browse notebooks from Kabum and Mercado Livre with technical spec filters (CPU, GPU, RAM, storage, brand, price), prices auto-refresh every 6-8h. This phase delivers a working product, not infrastructure for future phases.

</domain>

<decisions>
## Implementation Decisions

### Tech Stack (locked from research)
- **D-01:** Playwright > Puppeteer — stealth plugin abandoned since 2022
- **D-02:** Fastify deploy on Render, not Vercel — cold start/WebSocket issues
- **D-03:** Drizzle ORM + Neon Postgres — schema versioned via migrations
- **D-04:** TanStack Table + shadcn/ui — no Zustand, URL params for filter state

### Schema (locked)
- **D-05:** Tables: products, notebooks, prices, product_groups (empty for future dedup), scrape_logs, parse_errors
- **D-06:** prices table append-only (INSERT, never UPDATE) — enables price history
- **D-07:** Price stored as integer in centavos (not float)

### Sources (locked)
- **D-08:** Phase 1: Kabum (fetch/API), Mercado Livre (official API)
- **D-09:** Scraper isolation — error in one source doesn't break others (Promise.allSettled)

### the agent's Discretion

The following implementation details are flexible — planner chooses based on best practices:

- **Monorepo structure:** pnpm workspaces vs simple folder structure
- **Scraper organization:** per-source packages vs single src/scrapers folder
- **Parser fallback:** exact Claude API calling pattern (batch vs individual calls)
- **Pagination:** offset-based vs cursor-based for API
- **GHA workflow:** exact cron expression and retry logic

</decisions>

<specifics>
## Specific Ideas

- GPU filter = #1 differentiator — prioritize in UI
- Brazilian price parsing: "R$ 1.234,56" → 123456 (integer centavos)
- Parser: regex + lookup for ~80% coverage, Claude API fallback for edge cases
- URL params for filter state (shareable links)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, requirements, constraints
- `.planning/REQUIREMENTS.md` — All v1 requirements (31 total)
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, 5 plans
- `.planning/research/STACK.md` — Tech stack decisions with versions
- `.planning/research/SUMMARY.md` — Research synthesis

### Research findings
- `.planning/research/PITFALLS.md` — Cloudflare sources need Playwright, spec parser reliability critical

</canonical_refs>

  na
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project

### Established Patterns
- Per-source scraper pattern — each retailer isolated
- Append-only prices — free price history
- URL param state — shareable filter URLs

### Integration Points
- Scraper → Parser → Database → API → Frontend pipeline
- GHA cron triggers scraper, scraper writes to Neon, API reads, frontend displays

</code_context>

<deferred>
## Deferred Ideas

- Phase 2: Pichau, Terabyte, Magalu scrapers (Playwright + stealth for Cloudflare)
- Phase 3: Americanas, Amazon, manufacturers, PC components

</deferred>

---

*Phase: 01-foundation-mvp*
*Context gathered: 2025-05-12*