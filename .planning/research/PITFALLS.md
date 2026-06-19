# Pitfalls Research

**Domain:** E-commerce Web Scraping and Spec Validation
**Researched:** 2026-06-18
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Cloudflare & Anti-Bot Protection on Pichau

**What goes wrong:**
Scraper gets blocked with 403 Forbidden or stuck on "Checking your browser..." Cloudflare page.

**Why it happens:**
Pichau uses high Cloudflare protection levels. Standard headless browsers leave finger-print signs that trigger anti-bot systems.

**How to avoid:**
Use `playwright-extra` with `puppeteer-extra-plugin-stealth` equivalent setups, run in headful mode, set realistic User-Agents, and implement random delays between page requests. Alternatively, fetch static assets if possible, or scrape locally (avoiding datacenter IPs which are blacklisted immediately).

**Warning signs:**
Empty page returns, redirects to challenge pages, or script throws "Selector not found" errors.

**Phase to address:**
Phase 1 (Scraper validation and setup).

---

### Pitfall 2: Technical Specifications Formatting Discrepancies

**What goes wrong:**
GPU memory sizes parsed as strings, missing parameters, sockets represented differently (e.g. "AM4", "Socket AM4", "AM4 AMD").

**Why it happens:**
Retailers enter technical specs as free-text tables. No strict database control exists on retailer side.

**How to avoid:**
Write robust preprocessing hooks in Zod. Use regex to strip prefix and suffix noise, convert values to standard lowercase formats, and match them against a strict list of allowed sockets/chipsets.

**Warning signs:**
ETL pipeline failing on 50%+ of items, or filters showing multiple variations of the same category (e.g. "LGA1700" and "LGA 1700").

**Phase to address:**
Phase 1 (Zod validation setup).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Simple regex on title | Quick extraction of model. | Misses edge cases (e.g. "RTX 4060 Ti" matched as "RTX 4060"). | Never. Use full specification table parsing. |
| hardcoding selectors | Fast implementation. | Scraper breaks when retailer updates site design (frequent). | Acceptable for first iteration (MVP), but selectors must be isolated in config files. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Scraping sequentially | Scraping takes hours to complete. | Implement page pool/concurrency limits. | > 500 pages |
| Large Client-side bundle | Next.js page loading is slow due to too large `produtos.json`. | Compress JSON keys (e.g. `{ "name": "n", "price": "p" }`) and filter out unused specification fields. | > 10MB JSON size |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Stale pricing | User clicks link and product price changed or is out of stock. | Show scrap date clearly, add a refresh warning, and update scrap daily. |

---
*Pitfalls research for: pc-scrapper*
*Researched: 2026-06-18*
