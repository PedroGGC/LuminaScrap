# Feature Research

**Domain:** Hardware Aggregator & Scraper
**Researched:** 2026-06-18
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Retailer Scraping | Must fetch live prices from Pichau & Terabyte. | MEDIUM | Scraping dynamic spec tables and pricing selectors. |
| ETL Spec Standardization | socket "AM4" or "LGA1700" must be normalized. | HIGH | Zod parsing to normalize string variations. |
| In-Memory Client Filters | CPU socket, GPU VRAM, price range, retailer. | LOW | Next.js state-based filtering on array. |
| Availability Status | Mark items out-of-stock. | LOW | Filter out or flag sold-out products. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Zero-Latency Filtering | Filters update on every keystroke instantly (no API requests). | LOW | Handled completely client-side in React memory. |
| Spec Normalization | CPU TDP, socket, GPU core clock, memory bus. | MEDIUM | Extracted and parsed into clean tabular comparison. |
| Local Scraper Executable | Scrape locally via CLI to bypass IP blocks on hosting providers. | LOW | Bun script with simple CLI args. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time Database Search | Fresh prices. | High cost, infrastructure overhead, database maintenance. | Client-side memory loading of a daily-built JSON. |
| User Accounts & Alerts | Save builds, set price drop alert. | Requires Auth, Database, Mail Server (breaks zero-cost). | Save builds to client `localStorage`. |

## Feature Dependencies

```
[Retailer Scraping]
    └──requires──> [ETL Spec Standardization]
                       └──requires──> [Static JSON Generation]
                                          └──requires──> [In-Memory Frontend Filtering]
```

### Dependency Notes

- **Retailer Scraping requires ETL Spec Standardization**: Scraped raw strings are messy (e.g., "Placa de Vídeo Gigabyte RTX4060..." vs "NVIDIA RTX 4060..."). Specs must be validated to extract the actual GPU name and features.
- **Static JSON Generation requires ETL**: Only validated products are saved to JSON.
- **Frontend Filtering requires Static JSON**: Next.js loads the JSON at build time or via a single static request and filters in memory.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Scraper CLI for Pichau & Terabyte — essential to get raw data
- [ ] Zod Schemas for CPU and GPU — essential for parsing name, price, specs
- [ ] Next.js static page with client-side listing & filtering — essential to showcase values

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Local Storage bookmarks/build creator — save items locally without accounts
- [ ] Historical price charts — parsed from historical json runs

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scraper CLI | HIGH | MEDIUM | P1 |
| GPU/CPU Zod Schemas | HIGH | HIGH | P1 |
| Consolidated JSON Generation | HIGH | LOW | P1 |
| Basic Filtering Frontend | HIGH | MEDIUM | P1 |
| Bookmarks/Builds | MEDIUM | LOW | P2 |

## Competitor Feature Analysis

| Feature | MeuPC.net | Our Approach |
|---------|-----------|--------------|
| Search Latency | Medium (server-side query) | Zero (client-side in-memory array search) |
| Architecture | Database + Server | Static Web Page + Local JSON artifact |
| Specs quality | High | High (strict Zod checking) |

## Sources

- [MeuPC.net] — Feature structure analysis
- [Pichau website] — Spec formats and dynamic selectors
- [Terabyte website] — Spec formats and pricing structures

---
*Feature research for: pc-scrapper*
*Researched: 2026-06-18*
