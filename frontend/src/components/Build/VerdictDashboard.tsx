import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, HelpCircle, Activity, Info, FileText, Zap, ShieldCheck, Sparkles } from 'lucide-react';

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

  // Determine PSU progress bar gradient color
  const getPsuBarGradient = () => {
    if (psuLoadRatio > 90 || totalWattageLoad > psuWattage) return 'from-rose-500 to-red-600 shadow-glow-red';
    if (psuLoadRatio > 80) return 'from-amber-500 to-yellow-500 shadow-glow';
    return 'from-indigo-500 via-cyan-400 to-emerald-400 shadow-glow-cyan';
  };

  return (
    <div className="bg-[#090d16]/90 border-b border-[#1b2030] p-5 md:p-6 flex flex-col gap-5 relative z-10 font-sans backdrop-blur-xl">
      {/* Compatibility Status & Bottleneck Summary */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch justify-between">
        {/* System Health Card */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                Diagnóstico do Sistema
              </span>
            </div>
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition-all cursor-pointer"
              >
                <FileText size={14} />
                <span>Exportar Relatório PDF / TXT</span>
              </button>
            )}
          </div>

          {/* Status Message */}
          {errors.length > 0 ? (
            <div className="flex items-center gap-2.5 text-rose-400 font-semibold text-xs border border-rose-500/30 bg-rose-500/10 p-3 rounded-xl shadow-sm">
              <AlertCircle size={16} className="shrink-0 text-rose-400 animate-pulse" />
              <span>Incompatibilidades de Hardware Encontradas. Ajuste os componentes marcados.</span>
            </div>
          ) : warnings.length > 0 ? (
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-xs border border-amber-500/30 bg-amber-500/10 p-3 rounded-xl shadow-sm">
              <AlertTriangle size={16} className="shrink-0 text-amber-400" />
              <span>Avisos de Recomendação na Montagem.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-emerald-400 font-semibold text-xs border border-emerald-500/30 bg-emerald-500/10 p-3 rounded-xl shadow-sm">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>Sistema 100% Compatível! Sem gargalos severos nem conflitos físicos.</span>
            </div>
          )}

          {/* Detailed Warnings / Errors */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {errors.map((err, idx) => (
                <div key={`err-${idx}`} className="text-[11px] text-rose-300/90 pl-4 relative font-medium">
                  <span className="absolute left-1 top-1.5 h-1.5 w-1.5 bg-rose-400 rounded-full"></span>
                  {err}
                </div>
              ))}
              {warnings.map((warn, idx) => (
                <div key={`warn-${idx}`} className="text-[11px] text-amber-300/90 pl-4 relative font-medium">
                  <span className="absolute left-1 top-1.5 h-1.5 w-1.5 bg-amber-400 rounded-full"></span>
                  {warn}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottleneck Widget Card */}
        <div className="w-full lg:w-80 shrink-0 glass-panel p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1 text-slate-300">
              <Activity size={12} className="text-indigo-400" /> Gargalo de Performance
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
              bottleneckType === 'none' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              bottleneckType === 'cpu' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              bottleneckType === 'gpu' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-slate-800 text-slate-400'
            }`}>
              {bottleneckType === 'none' && 'Equilibrado'}
              {bottleneckType === 'cpu' && 'Gargalo CPU'}
              {bottleneckType === 'gpu' && 'Gargalo GPU'}
              {bottleneckType === 'waiting' && 'Pendente'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200 leading-snug">
              {bottleneckVerdict}
            </div>

            {hasCpu && hasGpu && (
              <div className="space-y-2 pt-2 border-t border-[#1b2030]">
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                  <div className="bg-[#07090e] p-2 rounded-lg border border-[#1d2334]">
                    <span className="text-slate-400 text-[10px] block">CPU Score</span>
                    <span className="text-indigo-400 font-bold text-sm">{cpuScore} pts</span>
                  </div>
                  <div className="bg-[#07090e] p-2 rounded-lg border border-[#1d2334] text-right">
                    <span className="text-slate-400 text-[10px] block">GPU Score</span>
                    <span className="text-cyan-400 font-bold text-sm">{gpuScore} pts</span>
                  </div>
                </div>

                {/* Cost efficiency */}
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono leading-normal pt-1">
                  <div className="text-slate-400">
                    Custo/100 Pts CPU:<br />
                    <span className="text-emerald-400 font-bold text-[10px]">{formatPrice(costPerFrameCpu)}</span>
                  </div>
                  <div className="text-right text-slate-400">
                    Custo/100 Pts GPU:<br />
                    <span className="text-emerald-400 font-bold text-[10px]">{formatPrice(costPerFrameGpu)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PSU Energy Consumption Meter */}
      <div className="space-y-2 border-t border-[#1b2030] pt-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap size={14} className="text-amber-400" />
            <span className="font-bold tracking-wide">CONSUMO ENERGÉTICO ESTIMADO (TDP)</span>
            <span className="text-[10px] text-slate-500 items-center gap-0.5 hidden sm:inline-flex">
              <Info size={10} /> inclui margem de segurança
            </span>
          </div>
          <div className="text-right text-slate-300">
            <span className="font-bold text-indigo-400 font-mono text-sm">{totalWattageLoad}W</span>
            {psuWattage > 0 ? (
              <span> / <span className="font-bold text-slate-400">{psuWattage}W Fonte</span> ({psuLoadRatio.toFixed(0)}%)</span>
            ) : (
              <span className="text-slate-500 font-medium"> (Nenhuma Fonte selecionada)</span>
            )}
          </div>
        </div>

        {psuWattage > 0 ? (
          <div className="w-full bg-[#07090e] border border-[#1b2030] rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getPsuBarGradient()}`}
              style={{ width: `${Math.min(psuLoadRatio, 100)}%` }}
            ></div>
          </div>
        ) : (
          <div className="w-full bg-[#07090e]/40 border border-dashed border-[#1b2030] rounded-full h-3"></div>
        )}
      </div>
    </div>
  );
};

