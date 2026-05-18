export const RAM_PATTERNS = [
  /(\d{1,2})\s*GB\s*(?:DDR[45])?/gi,
  /(\d{1,2})GB/gi,
];

export const RAM_TIERS = ['4GB', '8GB', '16GB', '32GB', '64GB'];

export function extractRAM(title: string): string | null {
  const matches = title.match(/(\d{1,2})\s*GB/i);
  if (matches) {
    const size = parseInt(matches[1]);
    if (size >= 4 && size <= 64) {
      return `${size}GB`;
    }
  }
  
  for (const tier of RAM_TIERS) {
    if (title.toLowerCase().includes(tier.toLowerCase())) {
      return tier;
    }
  }
  
  return null;
}

export function parseRAM(ram: string): number {
  const match = ram.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}