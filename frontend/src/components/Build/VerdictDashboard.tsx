import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, HelpCircle, Activity, Info, FileText } from 'lucide-react';

interface VerdictDashboardProps {
  errors: string[];
  warnings: string[];
  totalWattageLoad: number;
  psuWattage: number;
  psuLoadRatio: number;
  bottleneckVerdict: string;
  bottleneckType: 'none' | 'cpu' | 'gpu' | 'waiting';
  cpuScore: number;
  gpuScore: number;
  costPerFrameCpu: number;
  costPerFrameGpu: number;
  hasCpu: boolean;
  hasGpu: boolean;
  onOpenExport?: () => void;
}

export const VerdictDashboard: React.FC<VerdictDashboardProps> = ({
  errors,
  warnings,
  totalWattageLoad,
  psuWattage,
  psuLoadRatio,
  bottleneckVerdict,
  bottleneckType,
  cpuScore,
  gpuScore,
  costPerFrameCpu,
  costPerFrameGpu,
  hasCpu,
  hasGpu,
  onOpenExport,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Determine PSU progress bar color
  const getPsuBarColor = () => {
    if (psuLoadRatio > 90 || totalWattageLoad > psuWattage) return 'bg-red-500';
    if (psuLoadRatio > 80) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="bg-zinc-900/30 border-b border-zinc-800/80 p-6 flex flex-col gap-6 relative z-10">
      {/* Compatibility Status & Errors */}
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Status do Sistema</div>
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all duration-200"
              >
                <FileText size={14} />
                <span>Exportar Build (PDF / TXT)</span>
              </button>
            )}
          </div>
          {errors.length > 0 ? (
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs border border-red-500/20 bg-red-500/5 px-3 py-2 rounded-lg">
              <AlertCircle size={14} className="shrink-0" />
              <span>Incompatibilidades Detectadas! Corrija os componentes marcados.</span>
            </div>
          ) : warnings.length > 0 ? (
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs border border-amber-500/20 bg-amber-500/5 px-3 py-2 rounded-lg">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Avisos de Atenção na Build.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 rounded-lg">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Tudo certo! Sem conflitos de hardware.</span>
            </div>
          )}

          {/* List detailed errors */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto pr-1">
              {errors.map((err, idx) => (
                <div key={`err-${idx}`} className="text-[11px] text-red-400/90 pl-6 relative">
                  <span className="absolute left-2.5 top-1.5 h-1 w-1 bg-red-400 rounded-full"></span>
                  {err}
                </div>
              ))}
              {warnings.map((warn, idx) => (
                <div key={`warn-${idx}`} className="text-[11px] text-amber-400/90 pl-6 relative">
                  <span className="absolute left-2.5 top-1.5 h-1 w-1 bg-amber-400 rounded-full"></span>
                  {warn}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottleneck Widget */}
        <div className="w-full md:w-80 shrink-0 border border-zinc-800 bg-zinc-950/40 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
              <Activity size={10} /> Gargalo CPU & GPU
            </span>
            <span className="text-zinc-400 uppercase tracking-widest text-[9px]">
              {bottleneckType === 'none' && 'Equilibrado'}
              {bottleneckType === 'cpu' && 'Gargalo CPU'}
              {bottleneckType === 'gpu' && 'Gargalo GPU'}
              {bottleneckType === 'waiting' && 'Aguardando'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-zinc-200 truncate">
              {bottleneckVerdict}
            </div>

            {hasCpu && hasGpu && (
              <div className="space-y-2 pt-1.5 border-t border-zinc-900/60">
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono">
                  <div>
                    CPU Score: <span className="text-indigo-400 font-bold">{cpuScore}</span>
                  </div>
                  <div className="text-right">
                    GPU Score: <span className="text-indigo-400 font-bold">{gpuScore}</span>
                  </div>
                </div>
                {/* Cost per frame metrics */}
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-500 font-mono leading-normal border-t border-zinc-900/30 pt-1">
                  <div>
                    Custo/100 Pts CPU:<br />
                    <span className="text-emerald-400 font-semibold">{formatPrice(costPerFrameCpu)}</span>
                  </div>
                  <div className="text-right">
                    Custo/100 Pts GPU:<br />
                    <span className="text-emerald-400 font-semibold">{formatPrice(costPerFrameGpu)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PSU Capacity Indicator */}
      <div className="space-y-2 border-t border-zinc-800/60 pt-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span>CONSUMO ENERGÉTICO ESTIMADO</span>
            <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
              <Info size={10} /> +60W base
            </span>
          </div>
          <div className="text-right text-zinc-300">
            <span className="font-bold text-indigo-400">{totalWattageLoad}W</span>
            {psuWattage > 0 ? (
              <span> / <span className="font-bold text-zinc-500">{psuWattage}W Fonte</span> ({psuLoadRatio.toFixed(0)}%)</span>
            ) : (
              <span className="text-zinc-500 font-medium"> (Nenhuma Fonte selecionada)</span>
            )}
          </div>
        </div>

        {psuWattage > 0 ? (
          <div className="w-full bg-zinc-950 border border-zinc-900 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getPsuBarColor()}`}
              style={{ width: `${Math.min(psuLoadRatio, 100)}%` }}
            ></div>
          </div>
        ) : (
          <div className="w-full bg-zinc-950/20 border border-dashed border-zinc-900 rounded-full h-2.5"></div>
        )}
      </div>
    </div>
  );
};
