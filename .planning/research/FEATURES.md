# Feature Landscape: Painel de Preços de Notebooks (Brasil)

**Domain:** Price monitoring/aggregation panel for notebooks in Brazilian market
**Researched:** 2025-05-12
**Competitors analyzed:** Zoom.com.br, Buscapé, Bench Promos, Mercado Livre, Google Shopping, CamelCamelCamel

---

## Feature Origin Legend

| Tag | Meaning |
|-----|---------|
| [STANDARD] | Present in ALL major competitors (table stakes) |
| [COMMON] | Present in 2+ competitors |
| [RARE] | Present in 1 competitor or niche tool |
| [GAP] | Not found in any competitor — unique differentiator |
| [BR-MARKET] | Specific to Brazilian e-commerce reality |

---

## Table Stakes

Features users expect. Missing these = product feels broken or useless.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Multi-retailer price display** [STANDARD] | Core purpose: user must see who sells for how much | Medium | Shows cheapest + "compare in N stores". Zoom/Buscapé/BP all do this |
| **Search by product name/model** [STANDARD] | Users search "Notebook Gamer Acer Nitro 5" | Low | Free text + autocomplete |
| **Sort by price** [STANDARD] | Menor preço / Maior preço | Low | ASC/DESC toggle |
| **Sort by relevance** [STANDARD] | Default sort order | Low | Based on recency + data quality |
| **Price display with installments** [STANDARD] | Brazilian users expect parcelamento (10x, 12x) | Low | Show both à vista and parcelado pricing |
| **Brand filter** [STANDARD] | Dell, Lenovo, Acer, Samsung, Asus, HP, Apple, etc. | Low | Checkbox or dropdown |
| **Price range filter (slider)** [STANDARD] | "Mostre apenas notebooks entre R$2.000 e R$5.000" | Low | Double-thumb slider |
| **Responsive layout (mobile)** [STANDARD] | Brazilian shopping is heavily mobile | Medium | Table must collapse to card view on small screens |
| **Last-updated timestamp** [STANDARD] | Users need to know data freshness | Low | "Atualizado há 3 horas" badge per product |
| **Direct link to retailer** [STANDARD] | User clicks → opens product page | Low | Affiliate link or direct URL |
| **Pagination** [STANDARD] | Expected for browsing results | Low | 12-20 items per page |

---

## Expected Features (Common)

Present in most competitors. Missing these = notable gap.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **CPU filter** [COMMON] | Filter by i3/i5/i7/i9, Ryzen 3/5/7/9 | Medium | Requires spec parsing from titles |
| **RAM size filter** [COMMON] | 4GB, 8GB, 16GB, 32GB+ | Medium | Requires spec parsing |
| **Sort by rating** [COMMON] | Best rated first | Low | Only if ratings data available |
| **"Oferta do dia" / deal badge** [COMMON] | Highlighted products with good discounts | Medium | Requires price delta computation across retailers |
| **Cashback display** [COMMON] | Cashback percentage per retailer | Low | Only viable with affiliate partnerships |
| **CPU generation indicator** [COMMON] | "13ª geração", "14ª geração" | Medium | Requires parsing i5-13420H → 13th gen |
| **Sort by best rated** [COMMON] | Available on Zoom/Buscapé | Low | Only if review data accessible |

---

## Differentiators (Competitive Advantage)

Features that set this product apart. Not expected by users, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **GPU model filter** [RARE→GAP] | Filter by RTX 3050, RTX 4060, RTX 4050, integrated, etc. Bench Promos does this partially | Medium | **CRITICAL DIFFERENTIATOR.** No Brazilian tool does this well for notebooks. Bench Promos has it but only for gaming |
| **Combined CPU+GPU+RAM filter** [GAP] | "Mostre notebooks com i5+ RTX 4050 + 16GB RAM" | Medium | **PRIMARY DIFFERENTIATOR.** No competitor offers combined technical filtering in Brazil |
| **Price history chart** [RARE] | Line chart showing price over 30/60/90 days | Medium | Zoom doesn't offer this. CamelCamelCamel does for Amazon only. Bench Promos doesn't |
| **Storage type+size filter** [GAP] | SSD vs HD, 256GB, 512GB, 1TB | Medium | Requires spec parsing. No BR competitor does this |
| **Storage interface (NVMe vs SATA)** [GAP] | NVMe vs SATA SSD distinction | High | Rarely in title, often needs deep spec lookup |
| **Screen size filter** [RARE] | 14", 15.6", 16", 17.3" | Medium | Zoom has this as a category filter, not combined with other filters |
| **Price drop alert (no login)** [RARE] | URL-based alert: user bookmarks a filter set | Medium | No login required — shareable alert links |
| **Price trend indicator** [GAP] | \u2191 "Subiu 5% em 7 dias" / \u2193 "Caiu 12% em 30 dias" | Medium | Arrow + percentage + time period shown inline |
| **Best value score** [GAP] | Computed metric: (specs / price) ratio. "Melhor custo-benefício" | High | Subjective but useful. Danger of being gamed |
| **"Gamer" vs "Office" auto-classification** [GAP] | Auto-tag notebook as Gamer (has dGPU) or Office (integrated GPU) | Medium | ML or rule-based. Bench Promos has "gamer" as a search term but no tag |
| **Operating system filter** [RARE] | Windows 11, Windows 10, Linux, macOS | Medium | Often implicit in title. Bench Promos offers this as a filter |
| **Weight / portability indicator** [GAP] | Light (<1.5kg), Medium (1.5-2.2kg), Heavy (>2.2kg) | High | Spec rarely in title — would need deep scraping |
| **Coupon/discount code display** [RARE] | "Com cupom MEGA500: R$ 5.199,99" | Medium | Bench Promos does this. Requires manual/maintained list or partner API |
| **Side-by-side comparison (2-3 products)** [RARE] | Compare specs in a dialog/overlay | High | Zoom doesn't do this for notebooks. Significant UX complexity |
| **Link to YouTube reviews** [GAP] | Embed or link to review videos for each model | Low | Bench Promos marks "TESTADO NO CANAL" — similar concept |
| **Screen specs filter (resolution, refresh rate)** [GAP] | FHD, QHD, 4K, 60Hz, 120Hz, 144Hz, 165Hz | High | Rarely in title. Only Bench Promos does this, and only for gaming notebooks |

---

## Brazilian Market Specific Features

Features relevant to the Brazilian e-commerce reality.

| Feature | Why BR-Specific | Implementation Complexity | Notes |
|---------|-----------------|--------------------------|-------|
| **Frete grátis badge** [BR-MARKET] | BR consumers heavily weigh shipping cost | Medium | Requires scraping or inferring from product page |
| **Pix discount display** [BR-MARKET] | Pix often has ~5-10% discount vs credit card | Medium | Pricing varies by payment method in BR e-commerce |
| **Tax / import warning** [BR-MARKET] | Some products are imported with varying tax burdens | Medium | Relevant for sellers importing from China/Paraguay |
| **Sellers from Mercado Livre (full/trusted)** [BR-MARKET] | ML has "Full" (Mercado Envios) vs third-party sellers | Low | Affects shipping time and trust |
| **Condition filter** [BR-MARKET] | Novo vs Usado vs Recondicionado | Medium | Merging from multiple sources with different condition data |
| **Retailer-specific coupon codes** [BR-MARKET] | Kabum has MEGA coupons, Lenovo has AMIGOLENOVO, etc. | Medium | Bench Promos proves this works. Needs community or manual maintenance |
| **"Black Friday" / "Cyber Monday" price comparison** [BR-MARKET] | Compare current price vs pre-sale price during events | Medium | Requires storing prices before event dates |

---

## Anti-Features

Features to explicitly NOT build — they dilute focus or add complexity without user value for this project.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User accounts / login system** | Out of scope per PROJECT.md. Adds auth complexity, password reset, GDPR/LGPD compliance. | URL-based filter sharing, no-auth alerts |
| **User reviews / ratings** | Requires moderation, spam prevention, community management. Zoom already does this. | Link to existing reviews on retailer sites |
| **Price alert via email** | Requires email infrastructure, unsubscribe handling, deliverability. | Clipboard sharing or bookmarkable URL |
| **Affiliate / cashback system** | Requires commercial partnerships with every retailer. Legal/financial overhead. | Just link to retailer (no redirect through affiliate) |
| **Chat / messaging** | Completely outside scope | Not applicable |
| **Mobile app** | Web-first approach per PROJECT.md | Responsive web PWA |
| **Real-time price updates** | Impossible at scale without cost. 6-8h cycle is sufficient. | Show "last updated" timestamp — honesty builds trust |
| **Price prediction / ML forecasting** | Too speculative. Users want current data, not guesses. | Show historical trend, let user decide |
| **Multiple currency display** | BRL only market | Single currency (R$) |
| **International retailers** | Cross-border e-commerce is complex in BR. Focus on domestic. | National BR retailers + Amazon BR only |
| **Wishlist / favorites** | Requires auth or localStorage — auth is out of scope | Use browser bookmarks |

---

## Feature Dependencies

```
Spec Parser (CPU, GPU, RAM, storage, screen)
  ├── CPU filter
  ├── GPU filter
  ├── RAM filter
  ├── Storage filter
  ├── Screen size filter
  ├── Gamer/Office classification
  ├── CPU generation display
  └── Best value score

Price History (prices table)
  ├── Price trend indicator
  ├── Price history chart
  ├── Price drop badge
  └── Deal/Oferta detection

Multi-source Aggregation
  ├── Multi-retailer display
  ├── "Compare in N stores"
  ├── Cheapest price computation
  └── Retailer-specific coupons
```

**Key dependency chain:**
```
Scraper → Spec Parser → Filters → Multi-retailer aggregation → Price History
```

Without reliable spec parsing, most differentiators are impossible. This is the **critical path** and the highest-risk component (see PITFALLS.md).

---

## MVP Recommendation (Phase 1 — 2 weeks)

### Phase 1: Core Table Stakes + 1-2 Differentiators

**Prioritize:**
1. Multi-retailer aggregation (Kabum + ML) [table stakes]
2. Interactive table with TanStack Table [table stakes]
3. **CPU filter** [common — expected]
4. **GPU filter** [DIFFERENTIATOR — core competitive advantage]
5. RAM size filter [common — expected]
6. Price range slider [table stakes]
7. Brand filter [table stakes]
8. Price sorting [table stakes]
9. "Last updated" timestamp per product [table stakes]
10. **Best price across sources** [table stakes]

**Defer to Phase 2:**
- Price history chart
- Storage filter
- Screen size filter
- Side-by-side comparison
- Coupon codes
- Gamer/Office tags

**Why this ordering:**
- GPU filter is the #1 feature missing from Zoom/Buscapé. It's this project's reason for existence.
- CPU + GPU + RAM combined filtering is what no competitor offers. Ship this first.
- Price history is nice but not essential for a "which is cheapest NOW" decision.
- Side-by-side comparison is complex and adds UI complexity. Ship fast with the table first.

### Phase 2: Depth (Weeks 3-4)

- Add Pichau, Terabyte, Magalu sources
- Price history chart (`GET /prices/:id`)
- Detail sheet (`Sheet` component with full tech specs)
- Storage type filter (SSD vs HD, 256/512/1TB)
- Operating system filter
- Price trend indicator ("Subiu 5% em 7 dias")

### Phase 3: Scale (Future)

- Manufacturer sources (Dell, Avell, Acer)
- Americanas + Amazon BR
- Side-by-side comparison dialog
- Screen specs filter (resolution, refresh rate)
- Best value score
- Coupon code display
- Review video links

---

## Feature Prioritization Matrix

```
                    High Value
                        |
      Phase 2     |     Phase 1 (MVP)
      Price chart |     GPU filter***
      Storage     |     CPU+GPU+RAM combo***
      Trend arrow |     Best price
      OS filter   |     Multi-retailer
        |         |       |
  Hard -----------|----------- Easy
        |         |       |
      Defer       |     Phase 1-2
      Side-by-side|     Brand filter
      Coupons     |     Price range
      Value score |     Price sort
      Screen specs|     CPU filter
        |         |
                    Low Value
```

*** = Core differentiators

---

## Sources

- [Zoom.com.br Notebooks](https://www.zoom.com.br/notebook) — observed filters, sorting, and feature set (HIGH confidence — direct observation)
- [Buscapé Notebooks](https://www.buscape.com.br/notebook) — observed nearly identical feature set to Zoom (HIGH confidence — same parent company, same platform)
- [Bench Promos Notebooks](https://www.benchpromos.com.br/notebooks) — observed technical filters, GPU+CPU+RAM combinations, coupon codes (HIGH confidence — direct observation)
- [PROJECT.md](D:\Docs\Projetos Git\Web Scrapper de varejistas\.planning\PROJECT.md) — project scope, constraints, out of scope items (HIGH confidence)
- [relatorio-scraper-painel.md](D:\Docs\Projetos Git\Web Scrapper de varejistas\relatorio-scraper-painel.md) — planning document with shadcn components, data sources, build plan (HIGH confidence)
