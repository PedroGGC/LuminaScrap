import React, { useState } from 'react';
import { Gamepad2, Monitor, Gauge, Flame, Sparkles } from 'lucide-react';
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
    imageBg: 'from-amber-500/20 to-orange-600/10',
    cpuWeight: 0.012,
    gpuWeight: 0.006,
    igpuBaseFps: 95,
  },
  {
    id: 'fortnite',
    name: 'Fortnite (UE5)',
    category: 'eSports',
    imageBg: 'from-blue-500/20 to-indigo-600/10',
    cpuWeight: 0.005,
    gpuWeight: 0.0085,
    igpuBaseFps: 60,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    category: 'AAA',
    imageBg: 'from-yellow-500/20 to-red-600/10',
    cpuWeight: 0.0015,
    gpuWeight: 0.0055,
    igpuBaseFps: 28,
  },
  {
    id: 'gtav',
    name: 'GTA V / GTA RP',
    category: 'Open World',
    imageBg: 'from-emerald-500/20 to-teal-600/10',
    cpuWeight: 0.006,
    gpuWeight: 0.0055,
    igpuBaseFps: 55,
  },
  {
    id: 'rdr2',
    name: 'Red Dead Redemption 2',
    category: 'AAA',
    imageBg: 'from-red-600/20 to-stone-800/10',
    cpuWeight: 0.002,
    gpuWeight: 0.0058,
    igpuBaseFps: 32,
  },
  {
    id: 'warzone',
    name: 'CoD: Warzone',
    category: 'eSports',
    imageBg: 'from-zinc-500/20 to-emerald-900/10',
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
    if (fps >= 144) return { label: 'Competitivo (144+ FPS)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (fps >= 60) return { label: 'Fluído (60+ FPS)', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' };
    if (fps >= 30) return { label: 'Jogável (30-60 FPS)', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    return { label: 'Baixo Desempenho (<30 FPS)', color: 'text-red-400 border-red-500/30 bg-red-500/10' };
  };

  return (
    <div className="border border-zinc-800 bg-zinc-950/60 rounded-xl p-5 space-y-5">
      {/* Predictor Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">
              Previsão de FPS & Benchmark em Jogos
            </h3>
            {isUsingIgpu && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1 font-semibold">
                <Sparkles size={10} /> iGPU Mode
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Estimativa de desempenho em jogos populares com base no hardware selecionado.
          </p>
        </div>

        {/* Resolution & Quality Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setResolution('1080p')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                resolution === '1080p' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1080p
            </button>
            <button
              onClick={() => setResolution('1440p')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                resolution === '1440p' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1440p
            </button>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setPreset('Medium')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                preset === 'Medium' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Médio
            </button>
            <button
              onClick={() => setPreset('Ultra')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                preset === 'Ultra' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ultra
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Warning if empty */}
      {!hasHardware && (
        <div className="text-center py-8 text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-lg">
          Selecione um Processador ou Placa de Vídeo para ver a estimativa de FPS em tempo real.
        </div>
      )}

      {/* Game Cards Grid */}
      {hasHardware && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GAMES.map((game) => {
            const fps = calculateFps(game);
            const badge = getFpsBadge(fps);
            const maxBarFps = 240;
            const percentage = Math.min(100, (fps / maxBarFps) * 100);

            return (
              <div
                key={game.id}
                className={`p-3.5 rounded-lg border border-zinc-800/80 bg-gradient-to-br ${game.imageBg} flex flex-col justify-between space-y-3 relative overflow-hidden group hover:border-zinc-700 transition-all`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">
                      {game.category}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-100 truncate mt-0.5">
                      {game.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-extrabold text-zinc-100 font-mono tracking-tight">
                      {fps}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-semibold ml-1">FPS</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`px-2 py-0.5 rounded border ${badge.color} font-semibold`}>
                      {badge.label}
                    </span>
                    <span className="text-zinc-500 font-mono">{resolution} • {preset}</span>
                  </div>

                  {/* Animated Bar */}
                  <div className="w-full bg-zinc-950/80 border border-zinc-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
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
