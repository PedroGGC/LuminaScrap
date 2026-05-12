# AGENTS.md — Painel de Preços de Notebooks

## Project
Notebook price aggregation panel for Brazilian market. Scrapes Kabum, Mercado Livre (v1), Pichau, Terabyte, Magalu (v2), Americanas, Amazon, fabricantes (v3).

## Stack
- Scraper: TypeScript, Playwright (stealth), Cheerio, Zod
- API: Fastify, Drizzle ORM, Neon Postgres
- Frontend: Next.js, shadcn/ui, TanStack Table
- Infra: GitHub Actions (cron 6-8h), Render (API), Vercel (frontend)

## Key Decisions
- Playwright > Puppeteer (puppeteer-extra-plugin-stealth abandoned)
- Fastify on Render, not Vercel (@fastify/vercel has cold start issues)
- No Zustand — URL params + TanStack Table state
- product_groups table from Phase 1 (empty) for future dedup

## Workflow
GSD workflow active. All planning artifacts in `.planning/`.
Commands: /gsd-plan-phase N, /gsd-execute-phase N, /gsd-progress, /gsd-ship

## Active Phase
Phase 1: Foundation & MVP — 5 plans, 31 reqs
Plan: Kabum + ML scrapers, spec parser, schema, API, frontend table, GHA cron
