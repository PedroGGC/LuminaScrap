# Roadmap: Hardware Aggregator

## Overview

Build a zero-cost local hardware scraper and frontend. The scraper runs locally via Bun to extract and validate prices/specs from Pichau and Terabyte. The Next.js frontend is deployed statically, loading the compiled JSON and filtering products in-memory for instant search performance.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions

- [ ] **Phase 1: Scraper Core & Specs ETL** - Scraper directory scaffold, Bun project config, Zod specs validation, and Playwright/Cheerio scraper scripts.
- [ ] **Phase 2: Next.js Frontend & In-Memory Filtering** - Next.js project scaffold, instant client-side UI filtering, and static build configuration.
- [ ] **Phase 3: Scraper CLI Enhancements & Production Deploy** - CLI configurations for targeting categories, optimized JSON keys, and static deployment instructions.

## Phase Details

### Phase 1: Scraper Core & Specs ETL
**Goal**: Establish local scraper executable compiling validated CPU and GPU specifications into `produtos.json`.
**Depends on**: Nothing (first phase)
**Requirements**: Scraper CLI, CPU/GPU Zod Schemas, Consolidated JSON compilation
**Success Criteria**:
  1. Scraper runs via Bun CLI (`bun run scrape` or similar).
  2. Zod validation parses CPU/GPU hardware specifications without failing on format variations.
  3. Scraper outputs validated product list to `produtos.json`.
**Plans**: 1 plan

Plans:
- [ ] 01-01: Scraper Core, Specs & ETL (Consolidated)

### Phase 2: Next.js Frontend & In-Memory Filtering
**Goal**: React/Next.js app loading `produtos.json` with instant client-side filters.
**Depends on**: Phase 1
**Requirements**: Basic Filtering Frontend
**Success Criteria**:
  1. Frontend loads products directly from JSON.
  2. UI provides filters (search, price range, categories, sockets, retailers) with instant in-memory response.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Next.js frontend scaffold & design tokens
- [ ] 02-02: Client-side in-memory filter UI

### Phase 3: Scraper CLI Enhancements & Production Deploy
**Goal**: Scraper CLI options (args) and static export verification.
**Depends on**: Phase 2
**Requirements**: Optimizations
**Success Criteria**:
  1. Scraper CLI accepts arguments to target specific categories/retailers.
  2. Static build of frontend compiled and verified.
**Plans**: 1 plan

Plans:
- [ ] 03-01: Scraper parameters and production verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scraper Core & Specs ETL | 0/1 | Not started | - |
| 2. Next.js Frontend & In-Memory Filtering | 0/2 | Not started | - |
| 3. Scraper CLI Enhancements & Production Deploy | 0/1 | Not started | - |
