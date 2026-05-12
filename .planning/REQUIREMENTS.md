# Requirements: Painel de Preços de Notebooks

**Defined:** 2025-05-12
**Core Value:** Usuário encontra rapidamente o notebook com as specs que precisa pelo menor preço atual

## v1 Requirements

### Scraping

- [ ] **SCRAPE-01**: Scraper da Kabum extrai lista de notebooks via fetch + API pública/endpoint descoberto via DevTools
- [ ] **SCRAPE-02**: Scraper do Mercado Livre extrai notebooks via API oficial (`api.mercadolibre.com/sites/MLB/search`)
- [ ] **SCRAPE-03**: Cada scraper roda isoladamente — erro em uma fonte não quebra as outras (Promise.allSettled)
- [ ] **SCRAPE-04**: Timeout configurado por requisição (30s) com retry 2x em falha
- [ ] **SCRAPE-05**: Agendamento automático via GitHub Actions cron job a cada 6-8h

### Spec Parsing

- [ ] **PARSE-01**: Parser extrai CPU, GPU, RAM, armazenamento (tipo + tamanho) e marca do título do produto
- [ ] **PARSE-02**: Regex + lookup mapping cobre ~80% dos casos; Claude API como fallback para títulos não parseados
- [ ] **PARSE-03**: Suite de testes para parser com exemplares reais de títulos brasileiros
- [ ] **PARSE-04**: Preço normalizado de string BR ("R$ 1.234,56") para inteiro em centavos

### Database Schema

- [ ] **DATA-01**: Tabela `products` com id, nome, url, site, categoria, created_at
- [ ] **DATA-02**: Tabela `notebooks` estendendo products com cpu, gpu, ram, storage_type, storage_size, tela, marca
- [ ] **DATA-03**: Tabela `prices` com product_id, valor (centavos), scraped_at — append-only
- [ ] **DATA-04**: Tabela `product_groups` para agrupar mesmo produto entre lojas (estrutura criada, matching implementado depois)
- [ ] **DATA-05**: Migrations versionadas via Drizzle

### API

- [ ] **API-01**: `GET /notebooks` — lista paginada com filtros por CPU, GPU, RAM mínima, marca, preço min/max
- [ ] **API-02**: `GET /notebooks/:id` — detalhe completo do notebook
- [ ] **API-03**: `GET /prices/:id` — histórico de preço de um produto
- [ ] **API-04**: `POST /scrape` — disparo manual de scraping
- [ ] **API-05**: Documentação interativa via Scalar (`/docs`)

### Frontend

- [ ] **UI-01**: Tabela interativa com colunas: nome, marca, CPU, GPU, RAM, armazenamento, preço, loja, última atualização
- [ ] **UI-02**: Filtros combinados: CPU, GPU, RAM mínima, marca, faixa de preço
- [ ] **UI-03**: Busca textual por nome do produto
- [ ] **UI-04**: Ordenação por qualquer coluna (preço, RAM, data)
- [ ] **UI-05**: Estado dos filtros persistido em URL params (compartilhável)
- [ ] **UI-06**: Loading skeleton durante carregamento
- [ ] **UI-07**: Badges para GPU, marca, categoria Gamer/Office

### Infrastructure

- [ ] **INFRA-01**: Scrapers rodam em GitHub Actions com matrix por fonte (isolamento + paralelismo)
- [ ] **INFRA-02**: Neon Postgres serverless — schema criado via Drizzle push/migrate
- [ ] **INFRA-03**: API Fastify deployada em Render (ou Railway) — não Vercel (limitações @fastify/vercel)
- [ ] **INFRA-04**: Frontend Next.js deployado na Vercel
- [ ] **INFRA-05**: `.planning/` adicionado ao git

## v2 Requirements

### More Sources

- [ ] **SCRAPE-06**: Scraper da Pichau — Playwright + stealth plugin (Cloudflare bypass)
- [ ] **SCRAPE-07**: Scraper da Terabyte — Playwright (HTML dinâmico)
- [ ] **SCRAPE-08**: Scraper do Magalu — Playwright (cookie consent + JS render)

### Price History

- [ ] **API-06**: `GET /prices/:id` — endpoint existente + dados acumulados viabilizam gráfico
- [ ] **UI-08**: Gráfico de histórico de preço por produto (Chart component)
- [ ] **UI-09**: Sheet lateral com ficha técnica completa do notebook

### Dedup

- [ ] **DATA-06**: Lógica de matching de mesmo produto entre lojas (por nome normalizado + specs similares)
- [ ] **API-07**: `GET /notebooks?grouped=true` — agrupa mesmo produto de diferentes lojas

### Parser Refinements

- [ ] **PARSE-05**: Classificador Gamer/Office/Workstation a partir de GPU + CPU
- [ ] **PARSE-06**: Extração de tamanho de tela (polegadas)

## v3 Requirements

- [ ] **SCRAPE-09**: Scraper da Americanas — Playwright + stealth
- [ ] **SCRAPE-10**: Scraper da Amazon BR — PA-API (Associates)
- [ ] **SCRAPE-11**: Scraper de fabricantes (Dell, Avell, Acer) — DevTools por site
- [ ] **UI-10**: Comparação lado a lado de 2-3 notebooks (Dialog)
- [ ] **MODL-01**: Módulo de componentes de PC (CPU, GPU, RAM, SSD, HD)
- [ ] **MODL-02**: Módulo de PCs montados — extração de specs técnicas de cada componente

## Out of Scope

| Feature | Reason |
|---------|--------|
| Login / Autenticação de usuários | Painel pessoal/publicação sem necessidade |
| Chat ou mensagens | Fora do escopo |
| Aplicativo mobile | Web-first, possível futuro |
| Cashback ou afiliados | Complexidade desnecessária no MVP |
| Alertas de preço por email | v2+ talvez, mas não agora |
| Dados de lojas físicas | Apenas e-commerce online |
| Reviews / Avaliações de usuários | Mantido fora do escopo deliberadamente |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCRAPE-01 | Phase 1 | Pending |
| SCRAPE-02 | Phase 1 | Pending |
| SCRAPE-03 | Phase 1 | Pending |
| SCRAPE-04 | Phase 1 | Pending |
| SCRAPE-05 | Phase 1 | Pending |
| PARSE-01 | Phase 1 | Pending |
| PARSE-02 | Phase 1 | Pending |
| PARSE-03 | Phase 1 | Pending |
| PARSE-04 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| API-04 | Phase 1 | Pending |
| API-05 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| UI-04 | Phase 1 | Pending |
| UI-05 | Phase 1 | Pending |
| UI-06 | Phase 1 | Pending |
| UI-07 | Phase 1 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 1 | Pending |
| SCRAPE-06 | Phase 2 | Pending |
| SCRAPE-07 | Phase 2 | Pending |
| SCRAPE-08 | Phase 2 | Pending |
| API-06 | Phase 2 | Pending |
| UI-08 | Phase 2 | Pending |
| UI-09 | Phase 2 | Pending |
| DATA-06 | Phase 2 | Pending |
| API-07 | Phase 2 | Pending |
| PARSE-05 | Phase 2 | Pending |
| PARSE-06 | Phase 2 | Pending |
| SCRAPE-09 | Phase 3 | Pending |
| SCRAPE-10 | Phase 3 | Pending |
| SCRAPE-11 | Phase 3 | Pending |
| UI-10 | Phase 3 | Pending |
| MODL-01 | Phase 3 | Pending |
| MODL-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 31 total, all mapped to Phase 1 ✓
- v2 requirements: 10 total, all mapped to Phase 2 ✓
- v3 requirements: 6 total, all mapped to Phase 3 ✓
- Total across phases: 47/47 mapped ✓

---
*Requirements defined: 2025-05-12*
*Last updated: 2026-05-12 after roadmap creation*
