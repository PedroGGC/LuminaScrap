# Phase 1: Foundation & MVP — UI-SPEC.md

**Phase:** 1 (Foundation & MVP)
**Created:** 2025-05-12
**Status:** Ready for implementation

## 1. Page Layout

### Structure
- **Header:** Project title "Painel de Preços de Notebooks" + source filter badge (all/Kabum/ML)
- **Main Content:** Full-width TanStack Table with sticky header
- **Filter Bar:** Horizontal bar above table with filter controls
- **Footer:** Data freshness indicator (last updated timestamp)

### Responsive Breakpoints
- **Desktop (≥1024px):** Full table with all columns visible
- **Tablet (768-1023px):** Horizontal scroll for table, collapsible filters
- **Mobile (<768px):** Card view per notebook instead of table, stacked filters

## 2. Visual Design

### Color Palette
- **Background:** `#09090b` (zinc-950) — dark theme base
- **Surface:** `#18181b` (zinc-900) — cards/panels
- **Border:** `#27272a` (zinc-800) — dividers
- **Primary:** `#22c55e` (green-500) — CTA buttons, active states, price highlights
- **Secondary:** `#a1a1aa` (zinc-400) — secondary text, icons
- **Accent:** `#f97316` (orange-500) — price alerts, trend indicators

### Typography
- **Font Family:** `"Inter", system-ui, sans-serif` (Next.js default)
- **Headings:** 
  - H1: 24px/600 (page title)
  - H2: 18px/600 (section titles)
  - H3: 14px/500 (card titles)
- **Body:** 14px/400 — table cells, descriptions
- **Small:** 12px/400 — timestamps, metadata

### Spacing System
- **Base unit:** 4px
- **Section padding:** 24px (6 units)
- **Card padding:** 16px (4 units)
- **Element gap:** 8px (2 units) — between filters
- **Table cell padding:** 12px horizontal, 8px vertical

### Effects
- **Card shadows:** `0 1px 2px rgba(0,0,0,0.3)` — subtle, no blur
- **Hover states:** Background lightens by 5% (`zinc-800` → `zinc-700`)
- **Transitions:** 150ms ease-out for all interactive elements

## 3. Components

### Filter Bar Components
| Component | Type | States | Behavior |
|-----------|------|--------|----------|
| CPU Select | shadcn Select | default/hover/open/disabled | Dropdown with Intel/AMD generations |
| GPU Select | shadcn Select | default/hover/open/disabled | Dropdown with GPU models |
| RAM Slider | shadcn Slider | default/dragging/disabled | Min RAM in GB (4-64GB) |
| Brand Select | shadcn Select | default/hover/open/disabled | Multi-select for brands |
| Price Range | shadcn Slider | default/dragging | Min-Max price in BRL |
| Search Input | shadcn Input | default/focus/filled | Text search with debounce |
| Clear Filters | shadcn Button | default/hover/active | Ghost variant, resets all |

### Table Components
| Component | Columns | Behavior |
|-----------|---------|----------|
| Data Table | Name, Brand, CPU, GPU, RAM, Storage, Price, Store, Updated | Sortable columns, click to expand |
| Column Headers | Sortable | Click to toggle asc/desc, icon indicator |
| Row Hover | Highlight | Subtle background change on hover |
| Price Cell | Formatted | `R$ X.XXX,XX` format, green if best price |
| Store Badge | shadcn Badge | Kabum/ML with brand colors |

### State Components
| Component | States | Behavior |
|-----------|--------|----------|
| Loading Skeleton | static animation | Pulse animation, 8 skeleton rows |
| Empty State | no results | "Nenhum notebook encontrado" + clear filters button |
| Error State | api error | "Erro ao carregar dados" + retry button |

## 4. Interaction Patterns

### Filter Behavior
- **Debounce:** 300ms delay before API call on text/select changes
- **URL Sync:** Filters immediately update URL params (`?cpu=i5&ram=16`)
- **Shareable:** Full filter state encoded in URL, opening link restores filters

### Table Behavior
- **Pagination:** 50 items per page, infinite scroll or numbered pages
- **Sorting:** Single column sort, default by price asc
- **Row Click:** Opens inline expansion with full specs (no modal)

### Data Refresh
- **Indicator:** "Atualizado há X minutos" in footer
- **Manual:** Refresh button in header

## 5. Technical Requirements

### Stack Alignment
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** shadcn/ui components
- **Table:** TanStack Table v8
- **Styling:** Tailwind CSS (via shadcn)

### Performance Targets
- **FCP:** < 1.5s
- **LCP:** < 2.5s
- **Filter response:** < 500ms (client-side if < 1000 rows, server-side pagination otherwise)

## 6. Accessibility

- **Keyboard nav:** Full tab navigation, Enter to activate
- **Screen reader:** ARIA labels on all interactive elements
- **Color contrast:** Minimum 4.5:1 for text
- **Focus indicators:** Visible focus ring on all controls

---

*UI-SPEC.md created for Phase 1 — Foundation & MVP*
*Used by: gsd-planner for plan 01-05 (Frontend)*