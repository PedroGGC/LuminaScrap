export interface BaseProduct {
  source: string;
  name: string;
  priceCash: number;
  priceInstallment: number;
  link: string;
  image: string;
  isWhiteLabel: boolean;
}

export interface CpuProduct extends BaseProduct {
  type: 'cpu';
  specs: { socket: string };
}

export interface GpuProduct extends BaseProduct {
  type: 'gpu';
  specs: { vram: string; chipset: string };
}

export interface RamProduct extends BaseProduct {
  type: 'ram';
  specs: { capacity: string; generation: string; frequency: string };
}

export interface MotherboardProduct extends BaseProduct {
  type: 'motherboard';
  specs: { socket: string; chipset: string };
}

export interface PsuProduct extends BaseProduct {
  type: 'psu';
  specs: { wattage: string; certification: string };
}

export interface StorageProduct extends BaseProduct {
  type: 'storage';
  specs: { capacity: string; storageType: string };
}

export type Product = CpuProduct | GpuProduct | RamProduct | MotherboardProduct | PsuProduct | StorageProduct;
export type ProductCategory = 'cpu' | 'gpu' | 'ram' | 'motherboard' | 'psu' | 'storage';

export interface ProductsData {
  cpu: CpuProduct[];
  gpu: GpuProduct[];
  ram: RamProduct[];
  motherboard: MotherboardProduct[];
  psu: PsuProduct[];
  storage: StorageProduct[];
}

export interface BenchmarkScores {
  cpu: Record<string, number>;
  gpu: Record<string, number>;
}

export interface SelectedBuild {
  cpu: CpuProduct | null;
  gpu: GpuProduct | null;
  motherboard: MotherboardProduct | null;
  ram: RamProduct | null;
  ramQuantity: number;
  psu: PsuProduct | null;
  storage: StorageProduct | null;
}

