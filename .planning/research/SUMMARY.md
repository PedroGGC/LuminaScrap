# Project Research Summary

**Project:** Hardware Aggregator
**Domain:** E-commerce Scraping & Static Web Front-end
**Researched:** 2026-06-18
**Confidence:** HIGH

## Executive Summary

The project is a zero-cost hardware aggregator compiling products from major Brazilian retailers (Pichau and Terabyte). To avoid hosting fees, database overhead, and server-side bottlenecks, we implement a hybrid local-scraper and static frontend architecture. 

A high-performance TS web scraper runs locally (via Bun, Playwright, and Cheerio) to extract raw product specifications and pricing. It validates and normalizes the data against Zod schemas, outputting a consolidated `produtos.json`. This file is then placed in the frontend's static directory (Next.js), which displays the products and filters them instantly client-side.

Key risks include Cloudflare protection blocks on Pichau and messy, unstructured spec tables from both retailers.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Bun**: Fast runtime execution, built-in TS runner, ideal for scraping scripts.
- **Playwright**: Handles dynamic pages, lazy-loaded prices, and mimics human browsing behavior to avoid bot-detection.
- **Zod**: Strict spec validation and price formatting standardizer.
- **Next.js**: Static export (SSG) hosted on Vercel or Cloudflare Pages for zero costs.

### Expected Features

**Must have (table stakes):**
- Scrapers for CPU and GPU categories on Pichau & Terabyte.
- Spec normalizer (converting multiple socket and VRAM names to standardized values).
- Static compiled JSON artifact generation.
- Instant, non-blocking UI filters in-memory on frontend.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Scraper Scaffold & Zod Spec Validation
- **Rationale:** The frontend cannot be tested or designed without a stable, typed JSON schema and product data source.
- **Delivers:** Scraper directory scaffold, Zod validation schemas for CPUs and GPUs, and a working script extracting sample data to a local `produtos.json`.
- **Addresses:** Retailer Scraping, Zod Specs normalization.
- **Avoids:** Technical specs formatting discrepancies (by building strict normalizers first).

### Phase 2: Front-End & Client-Side Filtering
- **Rationale:** Once the data structure is solid, we can construct the UI and the client-side memory filter logic.
- **Delivers:** Next.js project scaffold, JSON loading mechanisms, instant UI search and filter blocks, and static compilation config.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Bun + TS is highly performant and shares types with Next.js. |
| Features | HIGH | Table stakes are clear; client-side filters are straightforward. |
| Architecture | HIGH | Zero cost static JSON deployment is verified and scalable up to tens of thousands of items. |
| Pitfalls | HIGH | Antidetect and normalization issues are well documented. |

**Overall confidence:** HIGH

---
*Research completed: 2026-06-18*
*Ready for roadmap: yes*
