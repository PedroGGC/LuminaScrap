# Architecture Research

**Domain:** Local Scraper & Static Frontend
**Researched:** 2026-06-18
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Scraper Layer (Local)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌─────────────┐     ┌──────────────┐  │
│  │ Playwright/  │ ──> │ Zod Schemas │ ──> │ File Writer  │  │
│  │ Cheerio      │     │ & ETL       │     │ (JSON)       │  │
│  └──────────────┘     └─────────────┘     └──────┬───────┘  │
│                                                  │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │ products.json
┌──────────────────────────────────────────────────┼──────────┘
│                       Frontend Layer (Next.js)   │
├──────────────────────────────────────────────────┼──────────┤
│  ┌───────────────────────────────────────────────▼──────┐  │
│  │             Static Deploy (Vercel/Cloudflare)        │  │
│  │  ┌──────────────────┐          ┌──────────────────┐  │  │
│  │  │ JSON Loader      │ ───────> │ React UI State   │  │  │
│  │  └──────────────────┘          │ (In-memory array)│  │  │
│  │                                └─────────┬────────┘  │  │
│  │                                          │           │  │
│  │                                ┌─────────▼────────┐  │  │
│  │                                │ Instant Filters  │  │  │
│  │                                └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Playwright Scrapers | Fetch HTML and wait for lazy-loaded pricing components. | Modular functions per retailer (`pichau.ts`, `terabyte.ts`). |
| Zod Validators | Validate data fields, clean raw prices, extract and format hardware specs (CPUs, GPUs). | Zod objects (`cpuSchema`, `gpuSchema`). |
| JSON Compiler | Group and save validated items to single `produtos.json`. | Node `fs` / Bun file writer. |
| Next.js Client | Fetch and load `produtos.json` once, feed into React state. | `useMemo` hooks for instant array filtering. |

## Recommended Project Structure

```
pc-scrapper/
├── scraper/              # Local Scraper Module (Bun)
│   ├── src/
│   │   ├── schemas/      # Zod validation schemas
│   │   │   ├── cpu.ts
│   │   │   ├── gpu.ts
│   │   │   └── product.ts
│   │   ├── retailers/    # Extraction scripts
│   │   │   ├── pichau.ts
│   │   │   └── terabyte.ts
│   │   ├── index.ts      # Scraper orchestrator CLI
│   │   └── etl.ts        # Specs cleaning & normalization
│   ├── package.json
│   └── tsconfig.json
├── frontend/             # Next.js Web App
│   ├── src/
│   │   ├── components/   # Filters, Product cards
│   │   ├── app/          # App router pages
│   │   └── public/       # target directory for compiled json
│   ├── package.json
│   └── tsconfig.json
```

### Structure Rationale

- **scraper/ folder:** Clean separation of scraper code from UI. Scraper runs on local machine, does not need dependencies like React.
- **scraper/src/schemas/:** Hardware-specific Zod validators that can eventually be imported by the frontend if shared workspace/monorepo config is set up later.

## Architectural Patterns

### Pattern 1: Extraction & Parsing Pipeline

Keep extraction separate from parsing. Scraper extracts raw strings, and a separate ETL stage applies Zod validation. This makes debugging simple when selectors change.

```typescript
interface RawProduct {
  name: string;
  priceRaw: string;
  link: string;
  retailer: string;
}

// Separate ETL stage:
const cleanProduct = (raw: RawProduct) => {
  // 1. Clean price string to number
  // 2. Parse specs with Zod
};
```

## Data Flow

### Request Flow

```
[Local Scraper Executed]
           │
           ▼
[Extract Pichau/Terabyte raw HTML]
           │
           ▼
[Validate & Normalize specs via Zod]
           │
           ▼
[Write products.json to frontend/public/]
           │
           ▼
[Deploy Frontend -> Client downloads products.json -> Filters in-memory]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100k products | Static JSON file in-memory filtering works perfectly (usually < 5MB). |
| 100k+ products | Consider sqlite/websql client-side database (e.g. wa-sqlite) or split JSONs by category. |

## Anti-Patterns

### Anti-Pattern 1: Live Scraping on Request

**What people do:** Write an API route in Next.js that runs Puppeteer on demand.
**Why it's wrong:** Slow execution (10s+), high resource consumption, Vercel Serverless timeout (10s limit), blocks IP quickly.
**Do this instead:** Run scraper locally as a cron task or manually, save output as static JSON.

---
*Architecture research for: pc-scrapper*
*Researched: 2026-06-18*
