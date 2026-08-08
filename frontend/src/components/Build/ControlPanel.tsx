import React, { useState } from 'react';
import { Cpu, CircuitBoard, Monitor, Layers, Zap, HardDrive, Search, X, Check, RotateCcw, AlertTriangle, Plus, Minus, Sparkles } from 'lucide-react';
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
    <div className="border border-zinc-800/80 rounded-lg bg-zinc-900/40 p-4 transition-all duration-200 hover:border-zinc-700/60">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-sm">
          <span className="text-indigo-400">{icon}</span>
          <span>{label}</span>
          {selected && quantity && quantity > 1 && (
            <span className="text-xs font-bold text-indigo-400 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {quantity}x
            </span>
          )}
        </div>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Limpar seleção"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {selected ? (
        <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5">
          <div className="min-w-0 flex-1">
            <h4 className="text-zinc-100 font-medium text-xs truncate leading-snug" title={selected.name}>
              {selected.name}
            </h4>
            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 uppercase tracking-wider">
                {selected.source}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                {getSpecLabel(selected)}
              </span>
              {extraBadge}
              {selected.isWhiteLabel && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-0.5">
                  <AlertTriangle size={8} /> White Label
                </span>
              )}
            </div>

            {/* Quantity Controls for RAM */}
            {onQuantityChange && (
              <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-indigo-500/10">
                <span className="text-[10px] text-zinc-400 font-medium">Quantidade:</span>
                <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5">
                  <button
                    onClick={() => onQuantityChange(qty - 1)}
                    disabled={qty <= 1}
                    className="p-0.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400"
                    title="Diminuir quantidade"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold text-indigo-300 font-mono px-1.5">
                    {qty}x
                  </span>
                  <button
                    onClick={() => onQuantityChange(qty + 1)}
                    disabled={qty >= 4}
                    className="p-0.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400"
                    title="Adicionar mais um pente de RAM (+)"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="text-emerald-400 font-bold text-xs">
              {formatPrice(selected.priceCash * qty)}
            </div>
            {qty > 1 && (
              <div className="text-[9px] text-zinc-500">
                {qty}x {formatPrice(selected.priceCash)}
              </div>
            )}
            <div className="text-[10px] text-zinc-500">
              10x de {formatPrice((selected.priceInstallment * qty) / 10)}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-3 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700/60 bg-zinc-950/20 text-zinc-500 hover:text-zinc-400 text-xs transition-colors flex justify-between items-center"
        >
          <span>{placeholder}</span>
          <Search size={12} />
        </button>
      )}

      {isOpen && !selected && (
        <div className="mt-3 border border-zinc-800 rounded-lg bg-zinc-950/90 shadow-2xl p-2 relative z-50 animate-in fade-in duration-100">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-2.5 text-zinc-600" size={14} />
              <input
                type="text"
                placeholder="Buscar componente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent pl-8 pr-2 py-1 text-xs text-zinc-200 outline-none placeholder-zinc-600"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-zinc-600 hover:text-zinc-400">
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[10px] text-zinc-300 outline-none"
            >
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-4 text-xs text-zinc-600">
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
                  className="w-full text-left p-2 rounded hover:bg-zinc-900 transition-colors flex items-center justify-between gap-4 text-xs group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-zinc-300 font-medium truncate group-hover:text-zinc-100">
                      {opt.name}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{opt.source}</span>
                      <span className="text-[9px] text-indigo-400">{getSpecLabel(opt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-emerald-400 font-semibold">{formatPrice(opt.priceCash)}</span>
                  </div>
                </button>
              ))
            )}
            {filtered.length > 50 && (
              <div className="text-center py-2 text-[10px] text-zinc-600 border-t border-zinc-900/60 mt-1">
                Exibindo primeiros 50 itens. Refine sua busca.
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

  return (
    <div className="space-y-6 flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>PC BUILDER PRO</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 tracking-normal uppercase">
                Cascading Lock
              </span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Selecione as peças para verificar compatibilidade em tempo real.
            </p>
          </div>
          {hasItems && (
            <button
              onClick={clearBuild}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-800 rounded bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 hover:border-zinc-700/60 text-[11px] transition-all duration-200"
            >
              <RotateCcw size={12} />
              <span>Limpar Build</span>
            </button>
          )}
        </div>

        {/* Dropdowns */}
        {options ? (
          <div className="space-y-4">
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Sparkles size={8} /> Vídeo Integrado (iGPU)
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
          <div className="flex items-center justify-center py-20 text-xs text-zinc-600 animate-pulse">
            Carregando componentes...
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-zinc-800/80 pt-4 mt-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Custo Total Cash</div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
              {formatPrice(totalCostCash)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {Object.values(build).filter(Boolean).length} Peças Selecionadas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
