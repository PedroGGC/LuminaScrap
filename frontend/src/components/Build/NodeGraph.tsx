import React, { useMemo } from 'react';
import { ReactFlow, Edge, Node, Position, Handle } from '@xyflow/react';
import { Cpu, CircuitBoard, Monitor, Layers, Zap, HardDrive } from 'lucide-react';
import { SelectedBuild } from '@/types/hardware';
import { getMotherboardRamGen } from '@/hooks/useBuildFilter';
import '@xyflow/react/dist/style.css';

interface NodeGraphProps {
  build: SelectedBuild;
  validation: {
    errors: string[];
    warnings: string[];
    totalWattageLoad: number;
    psuWattage: number;
    cpuTdp?: number;
    gpuTdp?: number;
  };
}

// Custom Node component inside graph
const CustomHardwareNode = ({ data }: any) => {
  const Icon = data.icon;
  const isSelected = !!data.product;

  return (
    <div className={`glass-panel w-60 text-left p-3.5 relative transition-all duration-300 ${
      data.hasError
        ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-950/30'
        : data.hasWarning
        ? 'border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-950/30'
        : isSelected
        ? 'border-indigo-500/50 bg-[#0c101c]/90 shadow-lg shadow-indigo-950/30'
        : 'border-[#1b2030] bg-[#070a12]/70'
    }`}>
      {/* React Flow Handles */}
      {data.targetHandle && (
        <Handle
          type="target"
          position={data.targetPosition || Position.Left}
          style={{ background: isSelected ? '#38bdf8' : '#1e293b', border: '2px solid #090d16', width: 10, height: 10 }}
        />
      )}
      {data.sourceHandle && (
        <Handle
          type="source"
          position={data.sourcePosition || Position.Right}
          style={{ background: isSelected ? '#6366f1' : '#1e293b', border: '2px solid #090d16', width: 10, height: 10 }}
        />
      )}

      <div className="flex items-center gap-2 mb-1.5">
        <span className={`p-1 rounded-md ${
          data.hasError
            ? 'bg-rose-500/20 text-rose-400'
            : isSelected
            ? 'bg-indigo-500/20 text-cyan-400'
            : 'bg-[#121624] text-slate-500'
        }`}>
          <Icon size={14} />
        </span>
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{data.label}</span>
      </div>

      <div className="text-[11px] font-semibold text-slate-100 truncate leading-snug font-sans">
        {isSelected ? data.product.name : 'Componente ausente'}
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1b2030] text-[9px] font-mono text-slate-400">
        <div className="truncate max-w-[120px]">{isSelected ? data.specValue : 'Selecione'}</div>
        {isSelected && (
          <div className="text-emerald-400 font-bold text-[10px]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.product.priceCash)}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  hardware: CustomHardwareNode,
};

export const NodeGraph: React.FC<NodeGraphProps> = ({ build, validation }) => {
  const socketMismatch = useMemo(() => {
    if (!build.cpu || !build.motherboard) return false;
    return build.cpu.specs.socket !== build.motherboard.specs.socket;
  }, [build.cpu, build.motherboard]);

  const ramMismatch = useMemo(() => {
    if (!build.motherboard || !build.ram) return false;
    return getMotherboardRamGen(build.motherboard) !== build.ram.specs.generation;
  }, [build.motherboard, build.ram]);

  const psuMismatch = useMemo(() => {
    if (!build.psu) return false;
    return validation.totalWattageLoad > validation.psuWattage;
  }, [build.psu, validation.totalWattageLoad, validation.psuWattage]);

  // Define Nodes layout: Motherboard at the center, other components radiating outward
  const nodes: Node[] = useMemo(() => {
    return [
      {
        id: 'mb',
        type: 'hardware',
        position: { x: 220, y: 180 },
        data: {
          label: 'Placa-Mãe',
          icon: CircuitBoard,
          product: build.motherboard,
          specValue: build.motherboard ? `${build.motherboard.specs.socket} • ${getMotherboardRamGen(build.motherboard)}` : '',
          hasError: socketMismatch || ramMismatch,
          targetHandle: true,
          targetPosition: Position.Left,
          sourceHandle: true,
          sourcePosition: Position.Right,
        },
      },
      {
        id: 'cpu',
        type: 'hardware',
        position: { x: 220, y: 10 },
        data: {
          label: 'Processador (CPU)',
          icon: Cpu,
          product: build.cpu,
          specValue: build.cpu ? `${build.cpu.specs.socket} • ${validation.cpuTdp ?? 65}W` : '',
          hasError: socketMismatch,
          sourceHandle: true,
          sourcePosition: Position.Bottom,
        },
      },
      {
        id: 'gpu',
        type: 'hardware',
        position: { x: 220, y: 350 },
        data: {
          label: 'Placa de Vídeo (GPU)',
          icon: Monitor,
          product: build.gpu,
          specValue: build.gpu ? `${build.gpu.specs.vram} • ${validation.gpuTdp ?? 200}W` : '',
          sourceHandle: true,
          sourcePosition: Position.Top,
        },
      },
      {
        id: 'ram',
        type: 'hardware',
        position: { x: 520, y: 180 },
        data: {
          label: 'Memória RAM',
          icon: Layers,
          product: build.ram,
          specValue: build.ram ? `${build.ram.specs.capacity} • ${build.ram.specs.generation}` : '',
          hasError: ramMismatch,
          targetHandle: true,
          targetPosition: Position.Left,
        },
      },
      {
        id: 'storage',
        type: 'hardware',
        position: { x: 520, y: 350 },
        data: {
          label: 'Armazenamento',
          icon: HardDrive,
          product: build.storage,
          specValue: build.storage ? `${build.storage.specs.capacity} • ${build.storage.specs.storageType}` : '',
          targetHandle: true,
          targetPosition: Position.Left,
        },
      },
      {
        id: 'psu',
        type: 'hardware',
        position: { x: -80, y: 180 },
        data: {
          label: 'Fonte (PSU)',
          icon: Zap,
          product: build.psu,
          specValue: build.psu ? `${build.psu.specs.wattage}` : '',
          hasError: psuMismatch,
          sourceHandle: true,
          sourcePosition: Position.Right,
        },
      },
    ];
  }, [build, socketMismatch, ramMismatch, psuMismatch, validation]);

  // Define edges with color changes & animation triggers on compatibility mismatches
  const edges: Edge[] = useMemo(() => {
    return [
      {
        id: 'cpu-mb',
        source: 'cpu',
        target: 'mb',
        animated: socketMismatch || (!!build.cpu && !!build.motherboard),
        style: socketMismatch
          ? { stroke: '#f43f5e', strokeWidth: 3 }
          : build.cpu && build.motherboard
          ? { stroke: '#6366f1', strokeWidth: 2 }
          : { stroke: '#1e293b', strokeWidth: 1.5 },
      },
      {
        id: 'ram-mb',
        source: 'mb',
        target: 'ram',
        animated: ramMismatch || (!!build.ram && !!build.motherboard),
        style: ramMismatch
          ? { stroke: '#f43f5e', strokeWidth: 3 }
          : build.ram && build.motherboard
          ? { stroke: '#38bdf8', strokeWidth: 2 }
          : { stroke: '#1e293b', strokeWidth: 1.5 },
      },
      {
        id: 'storage-mb',
        source: 'mb',
        target: 'storage',
        animated: !!build.storage && !!build.motherboard,
        style: build.storage && build.motherboard
          ? { stroke: '#38bdf8', strokeWidth: 2 }
          : { stroke: '#1e293b', strokeWidth: 1.5 },
      },
      {
        id: 'gpu-mb',
        source: 'gpu',
        target: 'mb',
        animated: !!build.gpu && !!build.motherboard,
        style: build.gpu && build.motherboard
          ? { stroke: '#818cf8', strokeWidth: 2 }
          : { stroke: '#1e293b', strokeWidth: 1.5 },
      },
      {
        id: 'psu-mb',
        source: 'psu',
        target: 'mb',
        animated: psuMismatch || !!build.psu,
        style: psuMismatch
          ? { stroke: '#f43f5e', strokeWidth: 3 }
          : build.psu
          ? { stroke: '#10b981', strokeWidth: 2 }
          : { stroke: '#1e293b', strokeWidth: 1.5 },
      },
    ];
  }, [build, socketMismatch, ramMismatch, psuMismatch]);

  return (
    <div className="flex-1 w-full bg-[#05070c] relative min-h-[500px]">
      {/* Tech grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e264015_1px,transparent_1px),linear-gradient(to_bottom,#1e264015_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
      />
    </div>
  );
};
export default NodeGraph;

