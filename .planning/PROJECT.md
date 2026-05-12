# Painel de Preços de Notebooks (Brasil)

## What This Is

Painel pessoal que agrega preços de notebooks de múltiplos varejistas brasileiros (Kabum, Mercado Livre, Pichau, Terabyte, Magalu, fabricantes). Verifica preços automaticamente a cada 6–8h via GitHub Actions, exibe dados em tabela interativa com filtros técnicos (CPU, GPU, RAM, armazenamento, marca, preço) e mantém histórico de variação de preço por produto. Expansão futura para componentes de PC e PCs montados.

## Core Value

Usuário encontra rapidamente o notebook com as specs que precisa pelo menor preço atual, com confiança de que os dados são recentes.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- Scraper de notebooks de múltiplas fontes (Kabum API pública, Mercado Livre API oficial)
- Parser de specs a partir de títulos de produto (regex + Claude API fallback)
- Schema Drizzle no Neon: tabelas `products`, `notebooks`, `prices`
- API REST (Fastify): listagem com filtros, detalhe do produto, histórico de preço
- Frontend (Next.js): tabela interativa com filtros técnicos (CPU, GPU, RAM, preço, marca)
- Agendamento automático via GitHub Actions (6–8h)
- Expansão futura: Pichau, Terabyte, Magalu, Americanas, Amazon BR, fabricantes (Dell, Avell, Acer)
- Expansão futura: módulo de componentes de PC (CPU, GPU, RAM, SSD, HD)
- Expansão futura: módulo de PCs montados com extração de specs técnicas

### Out of Scope

- Mobile app — web-first, possível app futuro
- Chat/Troca de mensagens — fora do escopo do projeto
- Login de usuários — painel pessoal e/ou publicação futura sem autenticação
- Dados de lojas físicas — apenas e-commerce online

## Context

Projeto pessoal para monitoramento de preços de hardware no Brasil. Inspirado por Benchpromos e Zoom, mas com filtros técnicos que esses sites não oferecem (CPU, GPU, RAM específicas). Usuário quer comparar specs reais, não apenas preço.

Parser de specs é o maior ponto de atenção — títulos de produto em varejistas BR são inconsistentes. Estratégia: regex + mapeamento como base, Claude API como fallback.

Stack decidida: TypeScript, Puppeteer (anti-bot), Cheerio (HTML estático), Zod (validação), Drizzle + Neon (banco serverless), Fastify (API), Next.js + shadcn/ui + TanStack Table (frontend), GitHub Actions (cron).

## Constraints

- **Tech**: Neon Postgres serverless — gratuito pra esse volume
- **Budget**: $0 — GitHub Actions free tier (2.000 min/mês), Neon free tier
- **Timeline**: MVP em 2 semanas (scaffold, schema, Kabum + ML, filtros básicos, cron)
- **Data freshness**: Preços com no máximo 8h de defasagem
- **Anti-bot**: Sites BR têm proteções variáveis — Puppeteer stealth para os mais restritivos
- **GitHub Actions**: ~1.350 min/mês estimados com ciclo de 8h e ~10 fontes — dentro do limite free

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fastify > Express | Mais rápido, tipagem nativa melhor, schema validation integrado | — Pending |
| Drizzle > Prisma | SQL mais explícito, bundle menor, DX equivalente | — Pending |
| Neon > SQLite | Scraper (GHA) e frontend (Vercel) precisam mesmo banco remoto | — Pending |
| Sem Zustand | TanStack Table + URL params cobrem estado | — Pending |
| GHA > Vercel Cron | Sem limite de timeout, Puppeteer funciona sem restrição | — Pending |
| Regex + Claude fallback | Regex pra 80% dos casos, Claude API pra títulos complexos | — Pending |
| Coarse granularity | 3-5 fases amplas, 1-3 planos cada | — Pending |

---

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
*Last updated: 2025-05-12 after initialization*
