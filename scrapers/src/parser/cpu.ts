export const CPU_PATTERNS = [
  /Intel\s+Core\s+i[359](?:\s+\d{4,5}[A-Z]*)?/gi,
  /Intel\s+Core\s+i[359]/gi,
  /Core\s+i[359]/gi,
  /Intel\s+Celeron|Pentium/gi,
  /AMD\s+Ryzen\s+[3579]\s+\d{4}[A-Z]*/gi,
  /Ryzen\s+[3579]/gi,
  /AMD\s+Ryzen\s+[3579]/gi,
  /\d{4,5}[A-Z]*\s+Gen/gi,
];

export const CPU_GENERATIONS: Record<string, number> = {
  'i9-14900': 14, 'i9-13900': 13, 'i9-12900': 12,
  'i7-14700': 14, 'i7-13700': 13, 'i7-12700': 12,
  'i5-14600': 14, 'i5-13600': 13, 'i5-12600': 12,
  'i3-14100': 14, 'i3-13100': 13, 'i3-12100': 12,
  'Ryzen 9': 7000,
  'Ryzen 7': 7000,
  'Ryzen 5': 7000,
  'Ryzen 3': 7000,
};

export function extractCPU(title: string): string | null {
  for (const pattern of CPU_PATTERNS) {
    const match = title.match(pattern);
    if (match) return match[0];
  }
  return null;
}