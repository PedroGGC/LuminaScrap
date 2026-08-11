import React, { useState } from 'react';
import { Cpu, CircuitBoard, Monitor, Layers, Zap, HardDrive, Search, X, Check, RotateCcw, AlertTriangle, Plus, Minus, Sparkles, ChevronDown } from 'lucide-react';
import { Product, SelectedBuild, CpuProduct, GpuProduct, MotherboardProduct, RamProduct, PsuProduct, StorageProduct } from '@/types/hardware';
import { hasIntegratedGpu } from '@/hooks/useBuildFilter';

interface CategorySelectProps {
  label: string;
  icon: React.ReactNode;
  options: Product[];
  selected: Product | null;
  onSelect: (item: Product | null) => void;
  placeholder: string;
  getSpecLabel: (item: any) => string;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  extraBadge?: React.ReactNode;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  label,
  icon,
  options,
  selected,
  onSelect,
  placeholder,
  getSpecLabel,
  quantity,
  onQuantityChange,
  extraBadge,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');

  const filtered = options
    .filter(opt => opt.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceCash - b.priceCash;
      if (sortBy === 'price-desc') return b.priceCash - a.priceCash;
      return a.name.localeCompare(b.name);
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const qty = quantity || 1;

  return (
    <div className={`glass-panel p-4 transition-all duration-300 ${selected ? 'border-indigo-500/40 bg-[#0d121f]/90 shadow-indigo-950/20' : 'hover:border-[#2a344d]'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5 text-slate-200 font-bold text-xs tracking-wide">
          <span className={`p-1.5 rounded-lg ${selected ? 'bg-indigo-500/20 text-cyan-400 border border-indigo-500/30' : 'bg-[#141926] text-slate-400 border border-[#20273b]'}`}>
            {icon}
          </span>
          <span className="font-sans">{label}</span>
          {selected && quantity && quantity > 1 && (
            <span className="text-[10px] font-bold text-cyan-300 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
              {quantity}x pente{quantity > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Limpar seleção de peça"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {selected ? (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-indigo-500/25 bg-[#090d16]/80 backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <h4 className="text-slate-100 font-semibold text-xs truncate leading-snug font-sans" title={selected.name}>
              {selected.name}
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#161c2c] border border-[#27324c] text-slate-300 uppercase tracking-wider">
                {selected.source}
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-300">
                {getSpecLabel(selected)}
              </span>
              {extraBadge}
              {selected.isWhiteLabel && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-0.5">
                  <AlertTriangle size={9} /> WL
                </span>
              )}
            </div>

            {/* Quantity Controls for RAM */}
            {onQuantityChange && (
              <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-[#1b2030]">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Qtd Pentes:</span>
                <div className="flex items-center gap-1 bg-[#07090e] border border-[#1e2538] rounded-lg px-1.5 py-0.5">
                  <button
                    onClick={() => onQuantityChange(qty - 1)}
                    disabled={qty <= 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Diminuir"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-xs font-bold text-cyan-300 font-mono px-2">
                    {qty}x
                  </span>
                  <button
                    onClick={() => onQuantityChange(qty + 1)}
                    disabled={qty >= 4}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Adicionar mais um pente (+)"
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="text-emerald-400 font-mono font-black text-sm tracking-tight">
              {formatPrice(selected.priceCash * qty)}
            </div>
            {qty > 1 && (
              <div className="text-[9px] text-slate-400 font-mono">
                {qty}x {formatPrice(selected.priceCash)}
              </div>
            )}
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              10x {formatPrice((selected.priceInstallment * qty) / 10)}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-3 rounded-xl border border-dashed border-[#1b2030] hover:border-indigo-500/50 bg-[#080a10]/50 hover:bg-[#0f1422] text-slate-400 hover:text-slate-200 text-xs transition-all flex justify-between items-center cursor-pointer group"
        >
          <span className="font-sans">{placeholder}</span>
          <div className="flex items-center gap-1.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
            <span className="text-[10px] font-semibold">Escolher</span>
            <Search size={13} />
          </div>
        </button>
      )}

      {isOpen && !selected && (
        <div className="mt-3 border border-[#22293e] rounded-xl bg-[#090d16]/95 backdrop-blur-xl shadow-2xl p-3 relative z-50 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 border-b border-[#1b2030] pb-2.5 mb-2.5">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Buscar componente por nome ou marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1b2030] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500/60 placeholder-slate-500 font-sans"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 text-slate-500 hover:text-slate-300">
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#07090e] border border-[#1b2030] rounded-lg px-2 py-1.5 text-[11px] text-slate-300 outline-none cursor-pointer font-medium"
            >
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                Nenhum componente compatível encontrado.
              </div>
            ) : (
              filtered.slice(0, 50).map((opt) => (
                <button
                  key={opt.link}
                  onClick={() => {
                    onSelect(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-[#131926] border border-transparent hover:border-[#22293e] transition-all flex items-center justify-between gap-3 text-xs group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-200 font-semibold truncate group-hover:text-cyan-300 transition-colors">
                      {opt.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{opt.source}</span>
                      <span className="text-[9px] font-mono text-indigo-400 font-medium">{getSpecLabel(opt)}</span>
                      {opt.isWhiteLabel && <span className="text-[9px] font-bold text-amber-400">WL</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-emerald-400 font-mono font-bold">{formatPrice(opt.priceCash)}</span>
                  </div>
                </button>
              ))
            )}
            {filtered.length > 50 && (
              <div className="text-center py-2 text-[10px] text-slate-500 font-mono border-t border-[#1b2030] mt-1">
                Exibindo 50 primeiros de {filtered.length} itens.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ControlPanelProps {
  build: SelectedBuild;
  selectComponent: (category: keyof SelectedBuild, item: any) => void;
  setRamQuantity?: (qty: number) => void;
  clearBuild: () => void;
  options: {
    cpu: CpuProduct[];
    gpu: GpuProduct[];
    motherboard: MotherboardProduct[];
    ram: RamProduct[];
    psu: PsuProduct[];
    storage: StorageProduct[];
  } | null;
  totalCostCash: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  build,
  selectComponent,
  setRamQuantity,
  clearBuild,
  options,
  totalCostCash,
}) => {
  const hasItems = build.cpu || build.gpu || build.motherboard || build.ram || build.psu || build.storage;
  const cpuHasIgpu = hasIntegratedGpu(build.cpu);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const selectedPiecesCount = Object.values(build).filter((val) => val !== null && val !== undefined && typeof val === 'object').length;

  return (
    <div className="space-y-6 flex flex-col h-full justify-between">
      <div className="space-y-5">
        {/* Header Card */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between gap-4 border-b border-[#1b2030] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-100 tracking-tight flex items-center gap-2 font-sans">
                  <span>PC BUILDER PRO</span>
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase tracking-wider">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Selecione as peças para validar sockets, TDP, gargalos e cálculo de FPS.
              </p>
            </div>
            {hasItems && (
              <button
                onClick={clearBuild}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1b2030] hover:border-red-500/40 rounded-xl bg-[#0e121c] text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm"
              >
                <RotateCcw size={13} />
                <span>Limpar Build</span>
              </button>
            )}
          </div>

          {/* Active selections progress */}
          <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Progresso da Montagem</span>
            <span className="font-mono font-bold text-slate-200">{selectedPiecesCount} de 6 componentes</span>
          </div>
          <div className="w-full bg-[#07090e] h-1.5 rounded-full overflow-hidden mt-2 border border-[#181d2c]">
            <div
              className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(selectedPiecesCount / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Dropdowns */}
        {options ? (
          <div className="space-y-3.5">
            <CategorySelect
              label="Processador (CPU)"
              icon={<Cpu size={16} />}
              options={options.cpu}
              selected={build.cpu}
              onSelect={(item) => selectComponent('cpu', item)}
              placeholder="Selecionar CPU (ex: Ryzen 5 5600G, i5 12400)"
              getSpecLabel={(c: CpuProduct) => c.specs.socket || 'UNKNOWN'}
              extraBadge={
                cpuHasIgpu ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-0.5">
                    <Sparkles size={8} /> iGPU (Vídeo Integrado)
                  </span>
                ) : null
              }
            />

            <CategorySelect
              label="Placa-Mãe (Motherboard)"
              icon={<CircuitBoard size={16} />}
              options={options.motherboard}
              selected={build.motherboard}
              onSelect={(item) => selectComponent('motherboard', item)}
              placeholder="Selecionar Placa-Mãe"
              getSpecLabel={(m: MotherboardProduct) => {
                const name = m.name.toLowerCase();
                const gen = name.includes('ddr5') || m.specs.socket === 'AM5' ? 'DDR5' : 'DDR4';
                return `${m.specs.socket || 'UNKNOWN'} • ${gen}`;
              }}
            />

            <CategorySelect
              label="Placa de Vídeo (GPU)"
              icon={<Monitor size={16} />}
              options={options.gpu}
              selected={build.gpu}
              onSelect={(item) => selectComponent('gpu', item)}
              placeholder="Selecionar GPU (ex: RTX 4060, RX 7600)"
              getSpecLabel={(g: GpuProduct) => g.specs.vram || 'UNKNOWN'}
            />

            <CategorySelect
              label="Memória RAM"
              icon={<Layers size={16} />}
              options={options.ram}
              selected={build.ram}
              onSelect={(item) => selectComponent('ram', item)}
              quantity={build.ramQuantity || 1}
              onQuantityChange={setRamQuantity}
              placeholder="Selecionar Memória RAM"
              getSpecLabel={(r: RamProduct) => `${r.specs.capacity || '8GB'} • ${r.specs.generation || 'DDR4'} • ${r.specs.frequency || ''}`}
            />

            <CategorySelect
              label="Fonte de Alimentação (PSU)"
              icon={<Zap size={16} />}
              options={options.psu}
              selected={build.psu}
              onSelect={(item) => selectComponent('psu', item)}
              placeholder="Selecionar Fonte de Alimentação"
              getSpecLabel={(p: PsuProduct) => `${p.specs.wattage || '500W'} • ${p.specs.certification || 'Bronze'}`}
            />

            <CategorySelect
              label="Armazenamento (SSD / HD)"
              icon={<HardDrive size={16} />}
              options={options.storage}
              selected={build.storage}
              onSelect={(item) => selectComponent('storage', item)}
              placeholder="Selecionar Armazenamento (ex: NVMe 1TB, SSD 480GB)"
              getSpecLabel={(s: StorageProduct) => `${s.specs.capacity || ''} • ${s.specs.storageType || 'SSD'}`}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-xs text-slate-500 animate-pulse font-mono">
            Carregando hardware e dados de compatibilidade...
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="glass-panel p-4 border-t border-[#1b2030] mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Custo Total à Vista</div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              {formatPrice(totalCostCash)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#141a29] border border-[#222c45] text-slate-300">
              {selectedPiecesCount} de 6 Peças
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

