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
import { Network, Gamepad2 } from 'lucide-react';

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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <div className="text-xs text-zinc-500 tracking-widest uppercase">Carregando PC Builder...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-red-500 flex items-center justify-center font-mono p-4">
        <div className="border border-red-500/20 bg-red-950/10 p-6 rounded-lg max-w-md w-full text-center space-y-2">
          <div className="font-bold text-xs uppercase tracking-wider">Erro de Inicialização</div>
          <div className="text-xs text-zinc-400">{error}</div>
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
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
      <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-zinc-800/80 bg-zinc-950">
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'graph'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Network size={14} />
          <span>Diagrama de Conectividade</span>
        </button>

        <button
          onClick={() => setActiveTab('fps')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'fps'
              ? 'bg-indigo-600/90 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Gamepad2 size={14} />
          <span>Benchmark & Previsão de FPS</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 relative overflow-y-auto">
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
          <div className="p-6">
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
    <div className="min-h-screen bg-zinc-950 flex flex-col font-mono overflow-hidden">
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
