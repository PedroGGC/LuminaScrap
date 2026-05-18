import { extractCPU } from './cpu.js';
import { extractGPU } from './gpu.js';
import { extractRAM } from './ram.js';
import { extractStorage } from './storage.js';
import { normalizePrice } from './price.js';

export interface ParsedSpecs {
  cpu: string | null;
  gpu: string | null;
  ram: string | null;
  storageType: string | null;
  storageSize: string | null;
  marca: string | null;
  price: number | null;
}

const BRAND_PATTERNS = [
  /Avell/i, /Dell/i, /Lenovo/i, /Asus/i, /Acer/i, /HP/i, /Samsung/i,
  /Apple/i, /MSI/i, /Razer/i, /LG/i, /Toshiba/i, /Positivo/i, /Vaio/i,
];

export function parseProductTitle(title: string, priceInput?: string | number): ParsedSpecs {
  const cpu = extractCPU(title);
  const gpu = extractGPU(title);
  const ram = extractRAM(title);
  const { type: storageType, size: storageSize } = extractStorage(title);
  
  let marca: string | null = null;
  for (const pattern of BRAND_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      marca = match[0];
      break;
    }
  }
  
  let price: number | null = null;
  if (priceInput) {
    if (typeof priceInput === 'number') {
      price = priceInput;
    } else {
      price = normalizePrice(priceInput);
    }
  }
  
  return { cpu, gpu, ram, storageType, storageSize, marca, price };
}

export function getConfidence(specs: ParsedSpecs): number {
  let score = 0;
  let total = 6;
  
  if (specs.cpu) score++;
  if (specs.gpu) score++;
  if (specs.ram) score++;
  if (specs.storageSize) score++;
  if (specs.marca) score++;
  if (specs.price !== null) score++;
  
  return score / total;
}