import React, { useState } from 'react';
import { Gamepad2, Monitor, Gauge, Flame, Sparkles, SlidersHorizontal } from 'lucide-react';
import { CpuProduct, GpuProduct } from '@/types/hardware';
import { hasIntegratedGpu } from '@/hooks/useBuildFilter';

interface FpsPredictorProps {
  cpu: CpuProduct | null;
  gpu: GpuProduct | null;
  cpuScore: number;
  gpuScore: number;
}

interface GameBenchmark {
  id: string;
  name: string;
  category: 'eSports' | 'AAA' | 'Open World';
  imageBg: string;
  cpuWeight: number;
  gpuWeight: number;
  igpuBaseFps: number;
}

const GAMES: GameBenchmark[] = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2 / Valorant',
    category: 'eSports',
    imageBg: 'from-amber-500/10 via-orange-600/5 to-transparent',
    cpuWeight: 0.012,
    gpuWeight: 0.006,
    igpuBaseFps: 95,
  },
  {
    id: 'fortnite',
    name: 'Fortnite (UE5)',
    category: 'eSports',
    imageBg: 'from-cyan-500/10 via-indigo-600/5 to-transparent',
    cpuWeight: 0.005,
    gpuWeight: 0.0085,
    igpuBaseFps: 60,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    category: 'AAA',
    imageBg: 'from-rose-500/10 via-red-600/5 to-transparent',
    cpuWeight: 0.0015,
    gpuWeight: 0.0055,
    igpuBaseFps: 28,
  },
  {
    id: 'gtav',
    name: 'GTA V / GTA RP',
    category: 'Open World',
    imageBg: 'from-emerald-500/10 via-teal-600/5 to-transparent',
    cpuWeight: 0.006,
    gpuWeight: 0.0055,
    igpuBaseFps: 55,
  },
  {
    id: 'rdr2',
    name: 'Red Dead Redemption 2',
    category: 'AAA',
    imageBg: 'from-[#b91c1c]/10 via-[#7c2d12]/5 to-transparent',
    cpuWeight: 0.002,
    gpuWeight: 0.0058,
    igpuBaseFps: 32,
  },
  {
    id: 'warzone',
    name: 'CoD: Warzone',
    category: 'eSports',
    imageBg: 'from-[#475569]/10 via-[#0f172a]/5 to-transparent',
    cpuWeight: 0.0035,
    gpuWeight: 0.007,
    igpuBaseFps: 40,
  },
];

export const FpsPredictor: React.FC<FpsPredictorProps> = ({
  cpu,
  gpu,
  cpuScore,
  gpuScore,
}) => {
  const [resolution, setResolution] = useState<'1080p' | '1440p'>('1080p');
  const [preset, setPreset] = useState<'Medium' | 'Ultra'>('Medium');

  const cpuHasIgpu = hasIntegratedGpu(cpu);
  const isUsingIgpu = cpuHasIgpu && !gpu;
  const hasHardware = cpu || gpu;

  // Calculate estimated FPS for a game
  const calculateFps = (game: GameBenchmark) => {
    if (!hasHardware) return 0;

    let baseFps = 0;
    if (gpu) {
      const effectiveCpuScore = cpuScore || 12000;
      const effectiveGpuScore = gpuScore || 10000;
      baseFps = (effectiveCpuScore * game.cpuWeight) + (effectiveGpuScore * game.gpuWeight);
    } else if (isUsingIgpu) {
      baseFps = game.igpuBaseFps * ((cpuScore || 15000) / 15000);
    } else {
      return 0; // No GPU and no iGPU
    }

    // Preset multipliers
    if (preset === 'Ultra') baseFps *= 0.72;

    // Resolution multipliers
    if (resolution === '1440p') baseFps *= 0.70;

    return Math.max(15, Math.round(baseFps));
  };

  const getFpsBadge = (fps: number) => {
    if (fps >= 144) return { label: 'Ultra Fluído (144+ FPS)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (fps >= 60) return { label: 'Fluído (60+ FPS)', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' };
    if (fps >= 30) return { label: 'Jogável (30-60 FPS)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    return { label: 'Baixo FPS (<30 FPS)', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5">
      {/* Predictor Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2030] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-cyan-400" size={20} />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide font-sans">
              Previsão de Desempenho em Jogos (FPS Engine)
            </h3>
            {isUsingIgpu && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1 font-bold">
                <Sparkles size={10} /> iGPU Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Estimativa de taxa de quadros por segundo calculada a partir da pontuação sintética da CPU e GPU.
          </p>
        </div>

        {/* Resolution & Quality Toggles */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex bg-[#07090e] border border-[#1b2030] rounded-xl p-1 text-xs">
            <button
              onClick={() => setResolution('1080p')}
              className={`px-3 py-1 rounded-lg font-semibold font-mono text-[11px] transition-all cursor-pointer ${
                resolution === '1080p' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1080p
            </button>
            <button
              onClick={() => setResolution('1440p')}
              className={`px-3 py-1 rounded-lg font-semibold font-mono text-[11px] transition-all cursor-pointer ${
                resolution === '1440p' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1440p Quad HD
            </button>
          </div>

          <div className="flex bg-[#07090e] border border-[#1b2030] rounded-xl p-1 text-xs">
            <button
              onClick={() => setPreset('Medium')}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                preset === 'Medium' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Qualidade Média
            </button>
            <button
              onClick={() => setPreset('Ultra')}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                preset === 'Ultra' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Qualidade Ultra
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Warning if empty */}
      {!hasHardware && (
        <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-[#1b2030] rounded-2xl bg-[#07090e]/30 font-mono">
          Selecione um Processador ou Placa de Vídeo no painel de controle para visualizar os benchmarks previstos.
        </div>
      )}

      {/* Game Cards Grid */}
      {hasHardware && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {GAMES.map((game) => {
            const fps = calculateFps(game);
            const badge = getFpsBadge(fps);
            const maxBarFps = 240;
            const percentage = Math.min(100, (fps / maxBarFps) * 100);

            return (
              <div
                key={game.id}
                className={`p-4 rounded-2xl border border-[#1d2438] bg-gradient-to-br ${game.imageBg} bg-[#0b0f19] flex flex-col justify-between space-y-3.5 relative overflow-hidden group hover:border-indigo-500/40 transition-all shadow-md`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                      {game.category}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5 font-sans">
                      {game.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-slate-100 font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                      {fps}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold ml-1">FPS</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded-md border ${badge.color} font-bold font-sans`}>
                      {badge.label}
                    </span>
                    <span className="text-slate-400 font-mono text-[9px]">{resolution} • {preset}</span>
                  </div>

                  {/* Animated Bar */}
                  <div className="w-full bg-[#07090e] border border-[#1b2030] rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

