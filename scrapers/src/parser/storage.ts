export const STORAGE_SIZE_PATTERNS = [
  /(\d+)\s*(?:TB|GB)\s*(?:SSD|NVMe|HDD)?/gi,
  /(?:SSD|NVMe|HDD)\s*(\d+\s*(?:TB|GB))/gi,
];

export const STORAGE_TYPE_PATTERNS = [
  /NVMe/gi,
  /SSD/gi,
  /HDD/gi,
];

export const STORAGE_TIERS = ['256GB', '512GB', '1TB', '2TB', '4TB'];

export function extractStorage(title: string): { type: string | null; size: string | null } {
  let type: string | null = null;
  let size: string | null = null;

  // Detect type first
  for (const pattern of STORAGE_TYPE_PATTERNS) {
    const match = title.match(pattern);
    if (match) {
      type = match[0].toUpperCase().replace(/[^A-Z]/g, '');
      break;
    }
  }

  // Detect size
  const sizeMatch = title.match(/(\d+)\s*(TB|GB)/i);
  if (sizeMatch) {
    const num = parseInt(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();
    if (unit === 'TB') {
      size = `${num}TB`;
    } else if (num >= 128) {
      size = `${num}GB`;
    }
  } else {
    // Check tier keywords
    for (const tier of STORAGE_TIERS) {
      if (title.toLowerCase().includes(tier.toLowerCase())) {
        size = tier;
        break;
      }
    }
  }

  return { type, size };
}