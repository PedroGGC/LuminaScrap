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
    <div className={`glass-node w-56 text-left relative ${
      data.hasError
        ? 'border-red-500/50 bg-red-950/20 shadow-red-950/20'
        : data.hasWarning
        ? 'border-amber-500/50 bg-amber-950/10 shadow-amber-950/10'
        : isSelected
        ? 'border-indigo-500/50 bg-indigo-950/10'
        : 'border-zinc-800 bg-zinc-950/60'
    }`}>
      {/* React Flow Handles */}
      {data.targetHandle && (
        <Handle
          type="target"
          position={data.targetPosition || Position.Left}
          style={{ background: '#3f3f46', border: '1px solid #27272a' }}
        />
      )}
      {data.sourceHandle && (
        <Handle
          type="source"
          position={data.sourcePosition || Position.Right}
          style={{ background: '#3f3f46', border: '1px solid #27272a' }}
        />
      )}

      <div className="flex items-center gap-2 mb-1.5">
        <span className={`${
          data.hasError
            ? 'text-red-400'
            : isSelected
            ? 'text-indigo-400'
            : 'text-zinc-500'
        }`}>
          <Icon size={14} />
        </span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{data.label}</span>
      </div>

      <div className="text-[11px] font-semibold text-zinc-100 truncate pr-2 leading-snug">
        {isSelected ? data.product.name : 'Não Selecionado'}
      </div>

      <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-zinc-500">
        <div>{isSelected ? data.specValue : '—'}</div>
        {isSelected && (
          <div className="text-emerald-400 font-bold">
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
        position: { x: 200, y: 180 },
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
        position: { x: 200, y: 20 },
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
        position: { x: 200, y: 340 },
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
        position: { x: 480, y: 180 },
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
        position: { x: 480, y: 340 },
        data: {
          label: 'Armazenamento (SSD / HD)',
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
        targetHandle: 'mb-target-top', // React Flow will resolve appropriately
        animated: socketMismatch,
        style: socketMismatch
          ? { stroke: '#ef4444', strokeWidth: 3 }
          : build.cpu && build.motherboard
          ? { stroke: '#6366f1', strokeWidth: 2 }
          : { stroke: '#27272a', strokeWidth: 1.5 },
      },
      {
        id: 'ram-mb',
        source: 'mb',
        target: 'ram',
        animated: ramMismatch,
        style: ramMismatch
          ? { stroke: '#ef4444', strokeWidth: 3 }
          : build.ram && build.motherboard
          ? { stroke: '#6366f1', strokeWidth: 2 }
          : { stroke: '#27272a', strokeWidth: 1.5 },
      },
      {
        id: 'storage-mb',
        source: 'mb',
        target: 'storage',
        animated: false,
        style: build.storage && build.motherboard
          ? { stroke: '#6366f1', strokeWidth: 2 }
          : { stroke: '#27272a', strokeWidth: 1.5 },
      },
      {
        id: 'gpu-mb',
        source: 'gpu',
        target: 'mb',
        animated: false,
        style: build.gpu && build.motherboard
          ? { stroke: '#6366f1', strokeWidth: 2 }
          : { stroke: '#27272a', strokeWidth: 1.5 },
      },
      {
        id: 'psu-mb',
        source: 'psu',
        target: 'mb',
        animated: psuMismatch,
        style: psuMismatch
          ? { stroke: '#ef4444', strokeWidth: 3 }
          : build.psu
          ? { stroke: '#6366f1', strokeWidth: 2 }
          : { stroke: '#27272a', strokeWidth: 1.5 },
      },
    ];
  }, [build, socketMismatch, ramMismatch, psuMismatch]);

  return (
    <div className="flex-1 w-full bg-zinc-950/40 relative">
      {/* Tech grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e10_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e10_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="w-full h-full"
      />
    </div>
  );
};
export default NodeGraph;
