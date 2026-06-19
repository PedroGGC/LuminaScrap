# Hardware Aggregator

## What This Is

Hardware aggregator focused on usability and perfect filters. Web scraper runs locally to scan retailers (Pichau, Terabyte), extract data, apply ETL/normalization with Zod, and generate consolidated `produtos.json` file served to React/Next.js frontend.

## Core Value

Instant client-side hardware filtering with zero hosting infrastructure cost.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Bun runtime and project configuration
- [ ] Scraper scaffold with Playwright and Cheerio
- [ ] Zod schemas for CPU and GPU validation/ETL
- [ ] Initial extraction script running locally
- [ ] Next.js frontend with in-memory client-side filters

### Out of Scope

- Hosting databases or server-side APIs — excluded due to zero-cost constraint

## Context

- Hybrid serverless setup with local scraper execution
- High-performance client-side logic to handle filtering in-memory
- Avoid complex hosting requirements by deploying static JSON artifact

## Constraints

- **Runtime**: Bun — extreme performance requirement
- **Language**: TypeScript — strict type safety
- **Extraction**: Playwright and Cheerio — support dynamic and static retailers
- **Validation**: Zod — data validation and technical specifications standardization
- **Frontend**: Next.js — static deployment with client-side filtering
- **Budget**: Zero-cost hosting architecture

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local Scraping & JSON artifact | Zero cost hosting, simple architecture | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-18 after initialization*
