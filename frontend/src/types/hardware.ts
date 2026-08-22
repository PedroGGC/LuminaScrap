export interface BaseProduct {
  id?: string;
  slug?: string;
  source: string;
  name: string;
  priceCash: number;
  priceInstallment: number;
  link: string;
  image: string;
  isWhiteLabel: boolean;
  offers?: any[];
  updatedAt?: string;
  createdAt?: string;
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

export interface MonitorProduct extends BaseProduct {
  type: 'monitor';
  specs: { resolution?: string; refreshRate?: string };
}

export interface KeyboardProduct extends BaseProduct {
  type: 'keyboard';
  specs: { switchType?: string; layout?: string };
}

export interface OtherProduct extends BaseProduct {
  type: 'other' | 'software' | 'case' | 'mouse';
  specs: Record<string, any>;
}

export type Product =
  | CpuProduct
  | GpuProduct
  | RamProduct
  | MotherboardProduct
  | PsuProduct
  | StorageProduct
  | MonitorProduct
  | KeyboardProduct
  | OtherProduct;

export type ProductCategory =
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'motherboard'
  | 'psu'
  | 'storage'
  | 'monitor'
  | 'keyboard';

export interface ProductsData {
  cpu: CpuProduct[];
  gpu: GpuProduct[];
  ram: RamProduct[];
  motherboard: MotherboardProduct[];
  psu: PsuProduct[];
  storage: StorageProduct[];
  monitor?: MonitorProduct[];
  keyboard?: KeyboardProduct[];
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

