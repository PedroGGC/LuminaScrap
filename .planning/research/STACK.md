# Stack Research

**Domain:** E-commerce Web Scraping and Serverless/Static Frontend
**Researched:** 2026-06-18
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Bun | 1.1.x | Runtime & Package Manager | High performance JS/TS execution, zero-config TS execution, fast startup. |
| TypeScript | 5.4.x | Language | Strict type safety for hardware structures and ETL boundaries. |
| Playwright | 1.44.x | Dynamic Scraper | Emulate real browser to bypass Cloudflare/dynamic JS loading on Pichau/Terabyte. |
| Cheerio | 1.0.0-rc.12 | Static Parser | Super fast HTML parsing when page source is statically retrievable or already loaded. |
| Zod | 3.23.x | Validation & ETL | Validate scraped records, parse spec tables into strict schemas, discard trash data. |
| Next.js | 14.2.x | Frontend | React framework with static HTML/JS export support (SSG) for zero-cost hosting. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | 0.378.x | UI Icons | For GPU, CPU, motherboard, and filtering icons in frontend. |
| Tailwind CSS | 3.4.x | Styling | Utility-first styling for fast UI design. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome | Linting and Formatting | Fast Rust-based alternative to ESLint/Prettier for Bun projects. |

## Installation

```bash
# Core
bun add zod playwright cheerio react react-dom next

# Dev dependencies
bun add -D typescript @types/react @types/react-dom biome
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Bun | Node.js | If target hosting environment lacks Bun compatibility (not applicable for local scrapers). |
| Playwright | Puppeteer | If specific legacy extensions are required (Playwright is generally faster and more reliable). |
| Static JSON | PostgreSQL + Prisma | If product data changes minute-by-minute and requires live server-side search instead of client-side. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Python Scrapy | Splitting codebase between Python (scraper) and JS (Next.js) prevents sharing Zod type schemas. | Bun + TS Scraper |
| Client-side Fetch to Live Scraper API | Scrapers are slow and blocking; running live queries causes timeouts. | Static `produtos.json` artifact |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js@14.2.x | React@18.2.x | Standard pairing for stable static exports. |
| Bun@1.1.x | Playwright@1.44.x | Fully supported runtime execution. |

## Sources

- [Playwright Docs] — Dynamic scraping execution
- [Bun Docs] — Runtime capabilities
- [MeuPC.net Stack Analysis] — Reverse engineering competitor structures

---
*Stack research for: pc-scrapper*
*Researched: 2026-06-18*
