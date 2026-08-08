import { useState, useMemo } from 'react';
import { ProductsData, BenchmarkScores, SelectedBuild, CpuProduct, GpuProduct, MotherboardProduct, RamProduct, PsuProduct } from '@/types/hardware';

// Heuristics for parsing/defaults
export function getCpuTdp(cpu: CpuProduct): number {
  const name = cpu.name.toLowerCase();
  // Regex to match "65w", "105w", etc.
  const tdpMatch = cpu.name.match(/(\d+)\s*[wW]/);
  if (tdpMatch) {
    const w = parseInt(tdpMatch[1]);
    if (w > 20 && w < 400) return w;
  }
  if (name.includes('ryzen 9') || name.includes('core i9')) return 250;
  if (name.includes('ryzen 7') || name.includes('core i7')) return 180;
  if (name.includes('ryzen 5') || name.includes('core i5')) return 120;
  return 65;
}

export function getGpuTdp(gpu: GpuProduct): number {
  const name = gpu.name.toLowerCase();
  const tdpMatch = gpu.name.match(/(\d+)\s*[wW]/);
  if (tdpMatch) {
    const w = parseInt(tdpMatch[1]);
    if (w > 50 && w < 600) return w;
  }
  if (name.includes('4090')) return 450;
  if (name.includes('4080')) return 320;
  if (name.includes('4070 ti') || name.includes('4070 super')) return 285;
  if (name.includes('4070')) return 200;
  if (name.includes('4060 ti')) return 160;
  if (name.includes('4060')) return 115;
  if (name.includes('3080') || name.includes('3090')) return 350;
  if (name.includes('3070')) return 220;
  if (name.includes('3060')) return 170;
  if (name.includes('7900 xt')) return 315;
  if (name.includes('7800 xt')) return 263;
  if (name.includes('7700 xt')) return 245;
  if (name.includes('7600')) return 165;
  if (name.includes('6600')) return 132;
  return 200;
}

export function getMotherboardSocket(motherboard: MotherboardProduct): string {
  const socket = motherboard.specs.socket?.toUpperCase();
  if (socket && socket !== 'UNKNOWN') return socket;

  const name = motherboard.name.toLowerCase();
  if (name.includes('am5')) return 'AM5';
  if (name.includes('am4')) return 'AM4';
  if (/\b(b650|a620|x670|b850|x870)m?\b/i.test(name)) return 'AM5';
  if (/\b(a320|b350|x370|b450|x470|a520|b550|x570)m?\b/i.test(name)) return 'AM4';
  if (/\b(h610|b660|h670|z690|b760|z790)m?\b/i.test(name)) return 'LGA1700';
  if (/\b(z890|b860|h810)m?\b/i.test(name)) return 'LGA1851';
  if (/\b(h410|b460|h470|z490|h510|b560|h570|z590)m?\b/i.test(name)) return 'LGA1200';
  if (/\b(h110|b150|z170|b250|z270|h310|b360|b365|z370|z390)m?\b/i.test(name)) return 'LGA1151';

  return 'UNKNOWN';
}

export function getMotherboardRamGen(motherboard: MotherboardProduct): 'DDR4' | 'DDR5' {
  const socket = getMotherboardSocket(motherboard);
  if (socket === 'AM5' || socket === 'LGA1851') return 'DDR5';
  if (socket === 'AM4' || socket === 'LGA1200' || socket === 'LGA1151' || socket === 'LGA1150' || socket === 'LGA1155') return 'DDR4';

  const name = motherboard.name.toLowerCase();
  if (/\b(b650|a620|x670|b850|x870)m?\b/i.test(name)) return 'DDR5';
  if (/\b(z890|b860|h810)m?\b/i.test(name)) return 'DDR5';
  if (name.includes('ddr5') || name.includes(' d5')) return 'DDR5';
  if (/\b(a320|b350|x370|b450|x470|a520|b550|x570)m?\b/i.test(name)) return 'DDR4';
  if (name.includes('ddr4') || name.includes(' d4')) return 'DDR4';

  return 'DDR4';
}

export function getCpuRamGen(cpu: CpuProduct): 'DDR4' | 'DDR5' | 'BOTH' {
  const socket = cpu.specs.socket?.toUpperCase() || '';
  if (socket === 'AM5' || socket === 'LGA1851') return 'DDR5';
  if (socket === 'AM4' || socket === 'LGA1200' || socket === 'LGA1151' || socket === 'LGA1150' || socket === 'LGA1155') return 'DDR4';
  if (socket === 'LGA1700') return 'BOTH';
  return 'BOTH';
}

export function getPsuWattage(psu: PsuProduct): number {
  const wattStr = psu.specs.wattage || '';
  const match = wattStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 500;
}

export function findCpuBenchmarkScore(cpu: CpuProduct, benchmarks: BenchmarkScores): number {
  const name = cpu.name.toLowerCase();
  for (const [key, val] of Object.entries(benchmarks.cpu)) {
    if (name.includes(key.toLowerCase())) return val;
  }
  return 15000; // fallback
}

export function findGpuBenchmarkScore(gpu: GpuProduct, benchmarks: BenchmarkScores): number {
  const name = gpu.name.toLowerCase();
  for (const [key, val] of Object.entries(benchmarks.gpu)) {
    if (name.includes(key.toLowerCase())) return val;
  }
  return 8000; // fallback
}

export function hasIntegratedGpu(cpu: CpuProduct | null): boolean {
  if (!cpu || !cpu.name) return false;
  const name = cpu.name.toLowerCase();

  if (name.includes('intel') || name.includes('core') || name.includes('ultra') || name.includes('i3') || name.includes('i5') || name.includes('i7') || name.includes('i9')) {
    if (/\b(i3|i5|i7|i9|ultra\s*\d+)-?\d{4,5}[k]?f\b/i.test(name) || /\b\d{4,5}kf?\b/i.test(name)) {
      return false;
    }
    return true;
  }

  if (name.includes('ryzen') || name.includes('athlon')) {
    if (/\b\d{4,5}g[e]?\b/i.test(name)) return true;
    if (/\bryzen\s*[3579]\s*(7\d{3}|9\d{3})/i.test(name) && !name.includes('7500f')) {
      return true;
    }
  }

  return false;
}

export function useBuildFilter(products: ProductsData | null, benchmarks: BenchmarkScores | null) {
  const [build, setBuild] = useState<SelectedBuild>({
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: null,
    ramQuantity: 1,
    psu: null,
    storage: null,
  });

  const clearBuild = () => {
    setBuild({
      cpu: null,
      gpu: null,
      motherboard: null,
      ram: null,
      ramQuantity: 1,
      psu: null,
      storage: null,
    });
  };

  const selectComponent = (category: keyof SelectedBuild, item: any) => {
    setBuild((prev) => ({
      ...prev,
      [category]: item,
    }));
  };

  const setRamQuantity = (quantity: number) => {
    setBuild((prev) => ({
      ...prev,
      ramQuantity: Math.max(1, Math.min(4, quantity)),
    }));
  };

  // Base list filtering out obvious scraped junk
  const cleanProducts = useMemo(() => {
    if (!products) return null;
    return {
      cpu: (products.cpu || []).filter(c => c.specs?.socket && c.specs.socket !== 'UNKNOWN'),
      gpu: products.gpu || [],
      motherboard: (products.motherboard || []).filter(m => getMotherboardSocket(m) !== 'UNKNOWN' && (m.name.toLowerCase().includes('placa') || m.name.toLowerCase().includes('motherboard') || m.name.toLowerCase().includes('rog') || m.name.toLowerCase().includes('tuf') || m.name.toLowerCase().includes('aorus'))),
      ram: (products.ram || []).filter(r => r.specs?.generation),
      psu: (products.psu || []).filter(p => p.specs?.wattage && p.specs.wattage !== 'UNKNOWN'),
      storage: products.storage || [],
    };
  }, [products]);

  // Options filtering with cascading locks
  const filteredOptions = useMemo(() => {
    if (!cleanProducts) return null;

    let availableCpus = cleanProducts.cpu;
    let availableMotherboards = cleanProducts.motherboard;
    let availableRams = cleanProducts.ram;

    if (build.cpu) {
      const cpuSocket = build.cpu.specs.socket;
      const cpuRamGen = getCpuRamGen(build.cpu);

      if (cpuSocket && cpuSocket !== 'UNKNOWN') {
        availableMotherboards = availableMotherboards.filter(m => getMotherboardSocket(m) === cpuSocket);
      }

      if (cpuRamGen !== 'BOTH') {
        availableRams = availableRams.filter(r => r.specs.generation === cpuRamGen);
      }
    }

    if (build.motherboard) {
      const mbSocket = getMotherboardSocket(build.motherboard);
      const mbRamGen = getMotherboardRamGen(build.motherboard);

      if (mbSocket && mbSocket !== 'UNKNOWN') {
        availableCpus = availableCpus.filter(c => c.specs.socket === mbSocket);
      }

      availableRams = availableRams.filter(r => r.specs.generation === mbRamGen);
    }

    if (build.ram) {
      const ramGen = build.ram.specs.generation;
      availableMotherboards = availableMotherboards.filter(m => getMotherboardRamGen(m) === ramGen);
      availableCpus = availableCpus.filter(c => {
        const cpuGen = getCpuRamGen(c);
        return cpuGen === 'BOTH' || cpuGen === ramGen;
      });
    }

    return {
      cpu: availableCpus,
      gpu: cleanProducts.gpu,
      motherboard: availableMotherboards,
      ram: availableRams,
      psu: cleanProducts.psu,
      storage: cleanProducts.storage,
    };
  }, [cleanProducts, build]);

  // Validation details
  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cpuHasIgpu = hasIntegratedGpu(build.cpu);

    // Socket matching check
    if (build.cpu && build.motherboard) {
      if (build.cpu.specs.socket !== build.motherboard.specs.socket) {
        errors.push(`Incompatibilidade de Socket: CPU usa ${build.cpu.specs.socket}, mas Placa-Mãe usa ${build.motherboard.specs.socket}.`);
      }
    }

    // RAM generation matching check
    if (build.motherboard && build.ram) {
      const mbRamGen = getMotherboardRamGen(build.motherboard);
      if (mbRamGen !== build.ram.specs.generation) {
        errors.push(`Incompatibilidade de Memória: Placa-Mãe suporta ${mbRamGen}, mas Memória RAM selecionada é ${build.ram.specs.generation}.`);
      }
    }

    // iGPU check if GPU is missing
    if (build.cpu && !build.gpu) {
      if (cpuHasIgpu) {
        warnings.push(`Vídeo Integrado: ${build.cpu.name} possui iGPU (vídeo integrado). Placa de vídeo dedicada é opcional.`);
      } else {
        warnings.push(`Sem Saída de Vídeo: ${build.cpu.name} NÃO possui vídeo integrado. É necessária uma Placa de Vídeo dedicada para gerar imagem.`);
      }
    }

    // PSU wattage calculations
    let cpuTdp = 0;
    let gpuTdp = 0;
    if (build.cpu) cpuTdp = getCpuTdp(build.cpu);
    if (build.gpu) gpuTdp = getGpuTdp(build.gpu);

    const extraTdp = 60 + ((build.ramQuantity || 1) - 1) * 5 + (build.storage ? 10 : 0); // Motherboard, RAMs, SSDs
    const totalWattageLoad = cpuTdp + gpuTdp + extraTdp;
    const psuWattage = build.psu ? getPsuWattage(build.psu) : 0;
    const psuLoadRatio = psuWattage > 0 ? (totalWattageLoad / psuWattage) * 100 : 0;

    if (build.psu) {
      if (totalWattageLoad > psuWattage) {
        errors.push(`Sobrecarga de Energia: Consumo estimado da build é ${totalWattageLoad}W, excedendo os ${psuWattage}W da Fonte.`);
      } else if (psuLoadRatio > 85) {
        warnings.push(`Carga Alta: Consumo estimado (${totalWattageLoad}W) está a ${psuLoadRatio.toFixed(0)}% da capacidade máxima da Fonte.`);
      }
    }

    // Performance & bottleneck analysis
    let bottleneckVerdict = 'Aguardando CPU e GPU';
    let bottleneckType: 'none' | 'cpu' | 'gpu' | 'waiting' = 'waiting';
    let cpuScore = 0;
    let gpuScore = 0;
    let costPerFrameCpu = 0;
    let costPerFrameGpu = 0;

    if (build.cpu && benchmarks) {
      cpuScore = findCpuBenchmarkScore(build.cpu, benchmarks);
      costPerFrameCpu = build.cpu.priceCash / (cpuScore / 100);
    }
    if (build.gpu && benchmarks) {
      gpuScore = findGpuBenchmarkScore(build.gpu, benchmarks);
      costPerFrameGpu = build.gpu.priceCash / (gpuScore / 100);
    }

    if (build.cpu && build.gpu && benchmarks) {
      const cpuRatio = cpuScore / 34000;
      const gpuRatio = gpuScore / 24000;
      const balanceRatio = gpuRatio / cpuRatio;

      if (balanceRatio < 0.6) {
        bottleneckVerdict = 'Gargalo de GPU: Processador muito potente para esta Placa de Vídeo.';
        bottleneckType = 'gpu';
      } else if (balanceRatio > 1.6) {
        bottleneckVerdict = 'Gargalo de CPU: Placa de Vídeo limitada pelo desempenho do Processador.';
        bottleneckType = 'cpu';
      } else {
        bottleneckVerdict = 'Configuração Equilibrada: Excelente balanço de performance CPU/GPU.';
        bottleneckType = 'none';
      }
    } else if (build.cpu && !build.gpu && cpuHasIgpu) {
      bottleneckVerdict = 'Uso com Vídeo Integrado (iGPU): Desempenho ideal para tarefas de escritório, mídia e jogos eSports leves.';
      bottleneckType = 'none';
    }

    // Total Cost including RAM Quantity multiplier & Storage
    const ramQty = build.ramQuantity || 1;
    const totalCostCash =
      (build.cpu?.priceCash || 0) +
      (build.gpu?.priceCash || 0) +
      (build.motherboard?.priceCash || 0) +
      ((build.ram?.priceCash || 0) * ramQty) +
      (build.psu?.priceCash || 0) +
      (build.storage?.priceCash || 0);

    const totalCostInstallment =
      (build.cpu?.priceInstallment || 0) +
      (build.gpu?.priceInstallment || 0) +
      (build.motherboard?.priceInstallment || 0) +
      ((build.ram?.priceInstallment || 0) * ramQty) +
      (build.psu?.priceInstallment || 0) +
      (build.storage?.priceInstallment || 0);

    return {
      errors,
      warnings,
      cpuTdp,
      gpuTdp,
      totalWattageLoad,
      psuWattage,
      psuLoadRatio,
      bottleneckVerdict,
      bottleneckType,
      cpuScore,
      gpuScore,
      costPerFrameCpu,
      costPerFrameGpu,
      totalCostCash,
      totalCostInstallment,
      cpuHasIgpu,
    };
  }, [build, benchmarks]);

  return {
    build,
    selectComponent,
    setRamQuantity,
    clearBuild,
    filteredOptions,
    validation,
    allProducts: cleanProducts,
  };
}
