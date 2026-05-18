export const GPU_PATTERNS = [
  /RTX\s+4090/gi,
  /RTX\s+4080/gi,
  /RTX\s+4070/gi,
  /RTX\s+4060/gi,
  /RTX\s+4050/gi,
  /RTX\s+3090/gi,
  /RTX\s+3080/gi,
  /RTX\s+3070/gi,
  /RTX\s+3060/gi,
  /RTX\s+3050/gi,
  /GTX\s+16\d{3}/gi,
  /GTX\s+1080/gi,
  /GTX\s+1070/gi,
  /GTX\s+1060/gi,
  /Intel\s+Arc/gi,
  /Radeon\s+RX\s+\d{4}/gi,
  /AMD\s+Radeon/gi,
  /NVIDIA\s+GeForce/gi,
  /Graphics\s+UHD/gi,
  /Intel\s+Iris/gi,
];

export const GPU_TIER: Record<string, number> = {
  'RTX 4090': 10, 'RTX 4080': 9, 'RTX 4070': 8, 'RTX 4060': 7, 'RTX 4050': 6,
  'RTX 3090': 9, 'RTX 3080': 8, 'RTX 3070': 7, 'RTX 3060': 6, 'RTX 3050': 5,
  'GTX 1660': 5, 'GTX 1650': 4,
  'Intel Arc': 5,
  'Radeon RX': 6,
  'Iris Xe': 3, 'UHD': 2,
};

export function extractGPU(title: string): string | null {
  for (const pattern of GPU_PATTERNS) {
    const match = title.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export function getGPUTier(gpu: string): number {
  for (const [key, tier] of Object.entries(GPU_TIER)) {
    if (gpu.toLowerCase().includes(key.toLowerCase())) return tier;
  }
  return 1;
}