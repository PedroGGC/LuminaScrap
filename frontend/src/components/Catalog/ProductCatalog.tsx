import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, X, ArrowUpDown } from 'lucide-react';
import { Product, ProductCategory } from '@/types/hardware';

interface ProductCatalogProps {
  products: Product[];
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ products }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSocket, setSelectedSocket] = useState<string>('all');
  const [selectedRamGen, setSelectedRamGen] = useState<string>('all');
  const [hideWhiteLabel, setHideWhiteLabel] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Extract unique stores
  const sources = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.source && set.add(p.source));
    return Array.from(set);
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      // Category
      if (selectedCategory !== 'all' && p.type !== selectedCategory) return false;
      // Source
      if (selectedSource !== 'all' && p.source !== selectedSource) return false;
      // White label
      if (hideWhiteLabel && p.isWhiteLabel) return false;
      // Max price
      if (p.priceCash > maxPrice) return false;

      // Specs checks
      const specs = (p as any).specs || {};
      if (selectedSocket !== 'all') {
        if (specs.socket !== selectedSocket) return false;
      }
      if (selectedRamGen !== 'all') {
        if (specs.generation !== selectedRamGen) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceCash - b.priceCash;
      if (sortBy === 'price-desc') return b.priceCash - a.priceCash;
      return a.name.localeCompare(b.name);
    });
  }, [products, search, selectedCategory, selectedSource, selectedSocket, selectedRamGen, hideWhiteLabel, maxPrice, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getSpecBadge = (p: Product) => {
    const specs = (p as any).specs || {};
    const type = p.type || '';
    if (type === 'cpu') return specs.socket || 'CPU';
    if (type === 'gpu') return specs.vram || 'GPU';
    if (type === 'motherboard') return `${specs.socket || ''} ${specs.chipset || ''}`.trim() || 'Placa-Mãe';
    if (type === 'ram') return `${specs.capacity || ''} ${specs.generation || ''}`.trim() || 'RAM';
    if (type === 'psu') return `${specs.wattage || ''} ${specs.certification || ''}`.trim() || 'PSU';
    if (type === 'storage') return `${specs.capacity || ''} ${specs.storageType || 'SSD'}`.trim() || 'STORAGE';
    return String(type).toUpperCase() || 'ITEM';
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)] bg-zinc-950 text-zinc-100 font-mono relative">
      {/* Sidebar Filter Panel */}
      <aside
        className={`transition-all duration-300 ease-in-out border-r border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md flex flex-col shrink-0 ${
          sidebarOpen ? 'w-72 p-5' : 'w-0 p-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs tracking-wider uppercase">
            <Filter size={14} className="text-indigo-400" />
            <span>Filtros do Catálogo</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Fechar Sidebar"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-1 flex-1 custom-scrollbar text-xs">
          {/* Category Filter */}
          <div>
            <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'cpu', label: 'CPUs' },
                { id: 'gpu', label: 'GPUs' },
                { id: 'motherboard', label: 'Placas-Mãe' },
                { id: 'ram', label: 'Memórias RAM' },
                { id: 'psu', label: 'Fontes' },
                { id: 'storage', label: 'Armazenamento' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-2.5 py-1.5 rounded text-left transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold'
                      : 'bg-zinc-950/40 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Store Source Filter */}
          <div>
            <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-2">
              Loja / Fonte
            </label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-indigo-500/50"
            >
              <option value="all">Todas as Lojas</option>
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Socket Filter */}
          {(selectedCategory === 'all' || selectedCategory === 'cpu' || selectedCategory === 'motherboard') && (
            <div>
              <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-2">
                Socket
              </label>
              <select
                value={selectedSocket}
                onChange={(e) => {
                  setSelectedSocket(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-indigo-500/50"
              >
                <option value="all">Todos os Sockets</option>
                <option value="AM4">AM4</option>
                <option value="AM5">AM5</option>
                <option value="LGA1700">LGA1700</option>
                <option value="LGA1851">LGA1851</option>
                <option value="LGA1200">LGA1200</option>
              </select>
            </div>
          )}

          {/* RAM Generation Filter */}
          {(selectedCategory === 'all' || selectedCategory === 'ram' || selectedCategory === 'motherboard') && (
            <div>
              <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider block mb-2">
                Geração RAM
              </label>
              <select
                value={selectedRamGen}
                onChange={(e) => {
                  setSelectedRamGen(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded px-2.5 py-1.5 text-zinc-300 outline-none focus:border-indigo-500/50"
              >
                <option value="all">Todas as Gerações</option>
                <option value="DDR4">DDR4</option>
                <option value="DDR5">DDR5</option>
                <option value="DDR3">DDR3</option>
              </select>
            </div>
          )}

          {/* Max Price Range */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                Preço Máximo (À vista)
              </label>
              <span className="text-emerald-400 font-semibold">{formatPrice(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="200"
              max="20000"
              step="200"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* White Label Checkbox */}
          <div className="pt-2 border-t border-zinc-800/60">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-zinc-100">
              <input
                type="checkbox"
                checked={hideWhiteLabel}
                onChange={(e) => {
                  setHideWhiteLabel(e.target.checked);
                  setCurrentPage(1);
                }}
                className="accent-indigo-500 rounded"
              />
              <span>Ocultar White Label</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 min-w-0 overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-300 text-xs transition-colors"
              >
                <SlidersHorizontal size={14} className="text-indigo-400" />
                <span>Filtros</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] md:min-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="Pesquisar componentes por nome..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500/50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between md:justify-end">
            <span className="text-xs text-zinc-400">
              <strong className="text-zinc-200">{filteredProducts.length}</strong> produtos encontrados
            </span>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-zinc-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-indigo-500/50"
              >
                <option value="price-asc">Menor Preço à Vista</option>
                <option value="price-desc">Maior Preço à Vista</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl text-center space-y-3">
            <Search size={32} className="text-zinc-600" />
            <h3 className="text-sm font-semibold text-zinc-300">Nenhum produto encontrado</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Tente redefinir os filtros de busca, categoria ou faixa de preço.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedProducts.map((p) => (
              <div
                key={p.link}
                className="glass-panel p-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-200 group"
              >
                <div>
                  {/* Top Image + Badges */}
                  <div className="relative aspect-square w-full bg-zinc-950/50 rounded-lg overflow-hidden border border-zinc-800/40 mb-3 flex items-center justify-center p-2">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Search size={24} className="text-zinc-700" />
                    )}
                    <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-300 uppercase tracking-wider">
                      {p.source}
                    </span>
                    {p.isWhiteLabel && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle size={9} /> WL
                      </span>
                    )}
                  </div>

                  {/* Category / Spec Badge */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                      {p.type}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-400">
                      {getSpecBadge(p)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4
                    className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors"
                    title={p.name}
                  >
                    {p.name}
                  </h4>
                </div>

                {/* Bottom Pricing & Link */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 space-y-3">
                  <div>
                    <div className="text-[10px] text-zinc-500">À vista no PIX</div>
                    <div className="text-emerald-400 font-extrabold text-sm font-mono">
                      {formatPrice(p.priceCash)}
                    </div>
                    {p.priceInstallment > 0 && (
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        10x de {formatPrice(p.priceInstallment / 10)}
                      </div>
                    )}
                  </div>

                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-indigo-600 border border-zinc-800 hover:border-indigo-500 rounded-lg text-zinc-200 hover:text-white text-xs font-semibold transition-all duration-200 shadow-sm"
                  >
                    <span>Ir para a Loja</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-6 mt-auto">
            <span className="text-xs text-zinc-500">
              Página <strong className="text-zinc-200">{currentPage}</strong> de{' '}
              <strong className="text-zinc-200">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                <span>Próxima</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
