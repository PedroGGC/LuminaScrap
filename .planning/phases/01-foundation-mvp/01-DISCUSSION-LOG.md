# Phase 1: Foundation & MVP - Discussion Log (Auto Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2025-05-12
**Phase:** 01-foundation-mvp
**Mode:** auto

## Assumptions Confirmed

### Tech Stack
| Decision | Source |
|----------|--------|
| Playwright > Puppeteer | Research: STACK.md — stealth plugin abandoned |
| Fastify on Render | Research: STACK.md — @fastify/vercel limitations |
| Drizzle + Neon | Research: SUMMARY.md |
| URL params + TanStack Table | Research: ARCHITECTURE.md |

### Schema
| Decision | Source |
|----------|--------|
| Append-only prices | Research: ARCHITECTURE.md |
| Price as integer centavos | Research: PITFALLS.md — Brazilian price format |
| product_groups table (empty) | Research: PITFALLS.md — needed for future dedup |

### Sources
| Decision | Source |
|----------|--------|
| Phase 1: Kabum + ML only | ROADMAP.md |
| Scraper isolation | Research: PITFALLS.md |

## Auto-Resolved

No gray areas required discussion — all key decisions locked from research phase.

## External Research

Research already complete in project initialization:
- STACK.md: Playwright, Fastify, Drizzle versions
- FEATURES.md: GPU filter as #1 differentiator
- ARCHITECTURE.md: per-source pattern, append-only prices
- PITFALLS.md: Cloudflare sources need Playwright, spec parser reliability