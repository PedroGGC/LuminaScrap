import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, X, ArrowUpDown, Sparkles, Store, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { Product } from '@/types/hardware';

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

  // Store brand badge color mapping
  const getStoreBadge = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('terabyte')) return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    if (s.includes('pichau')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (s.includes('kabum')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (s.includes('amazon')) return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
    if (s.includes('shopee')) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    if (s.includes('mercadolivre') || s.includes('mercado livre') || s.includes('meli')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    if (s.includes('magalu') || s.includes('magazine')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (s.includes('aliexpress')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Extract unique stores
  const sources = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.source && set.add(p.source));
    return Array.from(set);
  }, [products]);

  // Category label formatter
  const getCategoryLabel = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'cpu') return 'Processador';
    if (t === 'gpu') return 'Placa de Vídeo';
    if (t === 'motherboard') return 'Placa-Mãe';
    if (t === 'ram') return 'Memória';
    if (t === 'psu') return 'Fonte';
    if (t === 'storage') return 'Armazenamento';
    if (t === 'monitor') return 'Monitor';
    if (t === 'keyboard') return 'Teclado';
    if (t === 'mouse') return 'Mouse';
    if (t === 'case') return 'Gabinete';
    return 'Item';
  };

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Ignore software keys & non-hardware advertisements
      const nameLower = p.name.toLowerCase();
      if (
        p.type === ('software' as any) ||
        nameLower.includes('gvgmall') ||
        nameLower.includes('chave windows') ||
        nameLower.includes('windows 11 pro') ||
        nameLower.includes('windows 10 pro') ||
        nameLower.includes('chave de ativação')
      ) {
        return false;
      }

      // Ignore prebuilt PCs in component specific categories
      if (selectedCategory !== 'all') {
        const isPrebuiltTitle =
          nameLower.includes('pc gamer') ||
          nameLower.includes('pc home') ||
          nameLower.includes('pc montado') ||
          nameLower.includes('computador') ||
          nameLower.includes('desktop') ||
          (nameLower.includes('gb de ram') && (nameLower.includes('intel') || nameLower.includes('gt ') || nameLower.includes('rtx ') || nameLower.includes('rx ')));
        
        if (isPrebuiltTitle) return false;
      }

      // Search
      if (search && !nameLower.includes(search.toLowerCase())) return false;
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
    if (type === 'psu') return `${specs.wattage || ''} ${specs.certification || ''}`.trim() || 'Fonte';
    if (type === 'storage') return `${specs.capacity || ''} ${specs.storageType || 'SSD'}`.trim() || 'Armazenamento';
    if (type === 'monitor') return specs.refreshRate || 'Monitor';
    if (type === 'keyboard') return specs.switchType || 'Teclado';
    return getCategoryLabel(type);
  };

  return (
    <div className="flex min-h-[calc(100vh-61px)] bg-[#07090e] text-slate-100 font-sans relative overflow-hidden">
      {/* Background Ambient Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Sidebar Filter Panel */}
      <aside
        className={`transition-all duration-300 ease-in-out border-r border-[#1b2030] bg-[#090d16]/90 backdrop-blur-xl flex flex-col shrink-0 relative z-20 ${
          sidebarOpen ? 'w-72 p-5' : 'w-0 p-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2030] mb-5">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-xs tracking-wider uppercase">
            <Filter size={15} className="text-cyan-400" />
            <span>Filtros do Catálogo</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#141926] transition-colors cursor-pointer"
            title="Recolher Filtros"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-1 flex-1 custom-scrollbar text-xs">
          {/* Category Filter */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2.5">
              Categoria de Peça
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'cpu', label: 'CPUs' },
                { id: 'gpu', label: 'GPUs' },
                { id: 'motherboard', label: 'Placas-Mãe' },
                { id: 'ram', label: 'Memórias' },
                { id: 'psu', label: 'Fontes' },
                { id: 'storage', label: 'Armazenamento' },
                { id: 'monitor', label: 'Monitores' },
                { id: 'keyboard', label: 'Teclados' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-2.5 py-2 rounded-lg text-left transition-all duration-200 cursor-pointer font-medium text-xs ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                      : 'bg-[#0d111a] border border-[#1b2030] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Store Source Filter */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
              Loja / Fornecedor
            </label>
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#0d111a] border border-[#1b2030] rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
              >
                <option value="all">Todas as Lojas ({sources.length})</option>
                {sources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Socket Filter */}
          {(selectedCategory === 'all' || selectedCategory === 'cpu' || selectedCategory === 'motherboard') && (
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                Socket da CPU / Placa-Mãe
              </label>
              <select
                value={selectedSocket}
                onChange={(e) => {
                  setSelectedSocket(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#0d111a] border border-[#1b2030] rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
              >
                <option value="all">Todos os Sockets</option>
                <option value="AM4">AM4 (AMD)</option>
                <option value="AM5">AM5 (AMD)</option>
                <option value="LGA1700">LGA1700 (Intel)</option>
                <option value="LGA1851">LGA1851 (Intel)</option>
                <option value="LGA1200">LGA1200 (Intel)</option>
              </select>
            </div>
          )}

          {/* RAM Generation Filter */}
          {(selectedCategory === 'all' || selectedCategory === 'ram' || selectedCategory === 'motherboard') && (
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                Geração RAM
              </label>
              <select
                value={selectedRamGen}
                onChange={(e) => {
                  setSelectedRamGen(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#0d111a] border border-[#1b2030] rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
              >
                <option value="all">Todas as Gerações</option>
                <option value="DDR4">DDR4</option>
                <option value="DDR5">DDR5</option>
                <option value="DDR3">DDR3</option>
              </select>
            </div>
          )}

          {/* Max Price Range Slider */}
          <div className="bg-[#0d111a] p-3.5 rounded-xl border border-[#1b2030]">
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Preço Máximo (À vista)
              </label>
              <span className="text-emerald-400 font-bold font-mono text-xs">{formatPrice(maxPrice)}</span>
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
              className="w-full accent-indigo-500 bg-[#161b29] h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
              <span>R$ 200</span>
              <span>R$ 20.000+</span>
            </div>
          </div>

          {/* White Label Checkbox */}
          <div className="pt-2 border-t border-[#1b2030]">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-slate-100 p-2 rounded-lg hover:bg-[#141926] transition-colors">
              <input
                type="checkbox"
                checked={hideWhiteLabel}
                onChange={(e) => {
                  setHideWhiteLabel(e.target.checked);
                  setCurrentPage(1);
                }}
                className="accent-indigo-500 w-4 h-4 rounded border-slate-700 cursor-pointer"
              />
              <span className="text-xs font-medium">Ocultar Marcas White Label</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 p-5 md:p-8 flex flex-col gap-6 min-w-0 overflow-y-auto custom-scrollbar relative z-10">
        {/* Top Header / Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0d111a]/80 border border-[#1b2030] p-4 rounded-2xl backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#121624] border border-[#22293e] hover:border-indigo-500/50 hover:bg-[#171d2e] rounded-xl text-slate-200 text-xs font-medium transition-all cursor-pointer shadow-sm"
                title="Expandir Filtros"
              >
                <ChevronRight size={16} className="text-cyan-400" />
                <SlidersHorizontal size={14} className="text-indigo-400" />
                <span>Filtros</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] md:min-w-[340px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Buscar peças por modelo, marca, chipset (ex: RTX 4060, B550, Ryzen 7)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#07090e]/90 border border-[#1b2030] rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between md:justify-end">
            <div className="text-xs text-slate-400 font-medium">
              <strong className="text-slate-100 font-bold font-mono text-sm">{filteredProducts.length}</strong> itens encontrados
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#07090e]/90 border border-[#1b2030] rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500/60 transition-colors cursor-pointer font-medium"
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
          <div className="flex-1 flex flex-col items-center justify-center p-14 border border-dashed border-[#1b2030] rounded-2xl text-center space-y-3 bg-[#0d111a]/40">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Tente redefinir a busca, selecionar outra categoria ou aumentar a faixa de preço máximo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4.5">
            {paginatedProducts.map((p) => {
              const storeStyle = getStoreBadge(p.source);

              return (
                <div
                  key={p.link}
                  className="glass-panel glass-panel-hover p-4 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Top Image Container */}
                    <div className="relative aspect-square w-full bg-[#07090e]/70 rounded-xl overflow-hidden border border-[#181e2d] mb-3 flex items-center justify-center p-3 group-hover:border-indigo-500/30 transition-colors">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Search size={28} className="text-slate-700" />
                      )}

                      {/* Store Source Pill Badge */}
                      <span className={`absolute top-2 left-2 text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border uppercase tracking-wider shadow-sm ${storeStyle}`}>
                        {p.source}
                      </span>

                      {/* White Label Warning */}
                      {p.isWhiteLabel && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-0.5 shadow-sm">
                          <AlertTriangle size={9} /> WL
                        </span>
                      )}
                    </div>

                    {/* Category & Spec Badges */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-semibold">
                        {getCategoryLabel(p.type)}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-[#161b29] border border-[#232b3f] text-slate-300 font-medium">
                        {getSpecBadge(p)}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h4
                      className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors font-sans"
                      title={p.name}
                    >
                      {p.name}
                    </h4>
                  </div>

                  {/* Pricing & Store CTA */}
                  <div className="mt-4 pt-3 border-t border-[#1b2030] space-y-3">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">À vista no PIX</div>
                      <div className="text-emerald-400 font-mono font-extrabold text-base tracking-tight">
                        {formatPrice(p.priceCash)}
                      </div>
                      {p.priceInstallment > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          10x de {formatPrice(p.priceInstallment / 10)}
                        </div>
                      )}
                    </div>

                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#131724] hover:bg-gradient-to-r hover:from-indigo-600 hover:to-indigo-700 border border-[#22293e] hover:border-indigo-400/50 rounded-xl text-slate-200 hover:text-white text-xs font-semibold transition-all duration-200 shadow-md group/btn cursor-pointer"
                    >
                      <span>Ir para a Loja</span>
                      <ExternalLink size={13} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#1b2030] pt-6 mt-auto">
            <span className="text-xs text-slate-400 font-mono">
              Página <strong className="text-slate-200 font-bold">{currentPage}</strong> de{' '}
              <strong className="text-slate-200 font-bold">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0d111a] border border-[#1b2030] disabled:opacity-40 disabled:hover:border-[#1b2030] hover:border-indigo-500/40 hover:bg-[#141926] rounded-xl text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                <ChevronLeft size={15} />
                <span>Anterior</span>
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0d111a] border border-[#1b2030] disabled:opacity-40 disabled:hover:border-[#1b2030] hover:border-indigo-500/40 hover:bg-[#141926] rounded-xl text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

