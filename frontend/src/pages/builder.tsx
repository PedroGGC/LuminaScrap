import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useBuildFilter } from '@/hooks/useBuildFilter';
import { Navbar } from '@/components/Layout/Navbar';
import { SplitLayout } from '@/components/Layout/SplitLayout';
import { ControlPanel } from '@/components/Build/ControlPanel';
import { VerdictDashboard } from '@/components/Build/VerdictDashboard';
import { NodeGraph } from '@/components/Build/NodeGraph';
import { FpsPredictor } from '@/components/Build/FpsPredictor';
import { ExportBuildModal } from '@/components/Build/ExportBuildModal';
import { Network, Gamepad2, Cpu } from 'lucide-react';

export default function BuilderPage() {
  const { products, benchmarks, allProducts, loading, error } = useProducts();
  const {
    build,
    selectComponent,
    setRamQuantity,
    clearBuild,
    filteredOptions,
    validation,
  } = useBuildFilter(products, benchmarks);

  const [activeTab, setActiveTab] = useState<'graph' | 'fps'>('graph');
  const [isExportOpen, setIsExportOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
            <Cpu className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={20} />
          </div>
          <div className="text-xs font-mono text-slate-400 tracking-widest uppercase">Inicializando Engine PC Builder...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07090e] text-rose-400 flex items-center justify-center font-sans p-4">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-3 border-rose-500/30">
          <div className="font-mono font-bold text-xs uppercase tracking-wider text-rose-400">Falha ao Carregar Componentes</div>
          <div className="text-xs text-slate-400 leading-relaxed">{error}</div>
        </div>
      </div>
    );
  }

  const leftControlPanel = (
    <ControlPanel
      build={build}
      selectComponent={selectComponent}
      setRamQuantity={setRamQuantity}
      clearBuild={clearBuild}
      options={filteredOptions}
      totalCostCash={validation.totalCostCash}
    />
  );

  const rightVerdictPanel = (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090e]">
      {/* Verdict header and progress bars */}
      <VerdictDashboard
        errors={validation.errors}
        warnings={validation.warnings}
        totalWattageLoad={validation.totalWattageLoad}
        psuWattage={validation.psuWattage}
        psuLoadRatio={validation.psuLoadRatio}
        bottleneckVerdict={validation.bottleneckVerdict}
        bottleneckType={validation.bottleneckType}
        cpuScore={validation.cpuScore}
        gpuScore={validation.gpuScore}
        costPerFrameCpu={validation.costPerFrameCpu}
        costPerFrameGpu={validation.costPerFrameGpu}
        hasCpu={!!build.cpu}
        hasGpu={!!build.gpu}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Tab Controls for Node Graph vs FPS Predictor */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1b2030] bg-[#080b13]">
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'graph'
              ? 'bg-[#141a29] text-cyan-300 border border-indigo-500/40 shadow-md shadow-indigo-950/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1422]'
          }`}
        >
          <Network size={14} className={activeTab === 'graph' ? 'text-cyan-400' : ''} />
          <span>Diagrama de Conectividade</span>
        </button>

        <button
          onClick={() => setActiveTab('fps')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-sans transition-all cursor-pointer ${
            activeTab === 'fps'
              ? 'bg-[#141a29] text-cyan-300 border border-indigo-500/40 shadow-md shadow-indigo-950/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1422]'
          }`}
        >
          <Gamepad2 size={14} className={activeTab === 'fps' ? 'text-cyan-400' : ''} />
          <span>Benchmark & FPS Engine</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative overflow-y-auto custom-scrollbar">
        {activeTab === 'graph' ? (
          <NodeGraph
            build={build}
            validation={{
              errors: validation.errors,
              warnings: validation.warnings,
              totalWattageLoad: validation.totalWattageLoad,
              psuWattage: validation.psuWattage,
              cpuTdp: validation.cpuTdp,
              gpuTdp: validation.gpuTdp,
            }}
          />
        ) : (
          <div className="p-5 md:p-6">
            <FpsPredictor
              cpu={build.cpu}
              gpu={build.gpu}
              cpuScore={validation.cpuScore}
              gpuScore={validation.gpuScore}
            />
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportBuildModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        build={build}
        totalCostCash={validation.totalCostCash}
        totalCostInstallment={validation.totalCostInstallment}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col font-sans overflow-hidden">
      <Navbar itemCount={allProducts.length} />
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          leftControlPanel={leftControlPanel}
          rightVerdictPanel={rightVerdictPanel}
        />
      </div>
    </div>
  );
}

