import { z } from "zod";

// Helper to parse Brazilian price formats (e.g. R$ 1.500,00 or 1.500,00 or 1500)
export function parseBrlPrice(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return 0;

  let cleaned = val.replace(/R\$\s*/i, "").trim();
  cleaned = cleaned.replace(/\s/g, ""); // remove spaces

  if (cleaned.includes(",") && cleaned.includes(".")) {
    // standard BRL: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    // comma only: 1234,56 -> 1234.56
    cleaned = cleaned.replace(",", ".");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

const PriceField = z.union([z.number(), z.string()]).transform(parseBrlPrice);

// Forbidden terms filter
const FORBIDDEN_TERMS = [
  "usado",
  "caixa",
  "kit upgrade",
  "defeito",
  "computador",
  "notebook",
  "netbook",
  "ultrabook",
  "all in one",
  "all-in-one",
  "pc gamer",
  "pc office",
  "pc home",
  "pc corporativo",
  "pc completo",
  "pc profissional",
  "pc intel",
  "pc amd",
  "t-home",
  "t-gamer",
  "pc-gamer",
  "pc-office",
  "pc-home",
  "pc-completo",
  "pc-profissional"
];

export function containsForbiddenTerms(name: string): boolean {
  const lower = name.toLowerCase();
  return FORBIDDEN_TERMS.some((term) => lower.includes(term));
}

// White-label brand detection
const WHITE_LABEL_BRANDS = [
  "soyo",
  "mllse",
  "elsa",
  "machinist",
  "jingsha",
  "huananzhi",
  "maxsun",
  "kllisre",
  "mingzhou",
  "atermiter",
  "pelong",
  "jieshuo",
  "szmz",
  "onyx",
  "arsus",
  "corn",
  "resonate",
  "veineda",
  "sheli"
];

export function checkIsWhiteLabel(name: string): boolean {
  const lower = name.toLowerCase();
  return WHITE_LABEL_BRANDS.some((brand) => {
    const regex = new RegExp(`\\b${brand}\\b`, "i");
    return regex.test(lower);
  });
}

// Socket extraction and normalization
export function extractSocket(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes("am4")) return "AM4";
  if (lower.includes("am5")) return "AM5";

  const lgaMatch = name.match(/lga\s*(\d+)/i);
  if (lgaMatch) {
    return `LGA${lgaMatch[1]}`;
  }

  if (lower.includes("tr4")) return "TR4";
  if (lower.includes("strx4")) return "sTRX4";
  if (lower.includes("str5")) return "sTR5";

  return "UNKNOWN";
}

// VRAM extraction and normalization
export function extractVram(name: string): string {
  const match = name.match(/\b(\d+)\s*(?:gb|g|gib)\b/i);
  if (match) {
    return `${match[1]}GB`;
  }
  return "UNKNOWN";
}

// GPU Chipset extraction and normalization
export function extractGpuChipset(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, " ");
  
  const rtxMatch = cleanName.match(/rtx\s*(\d{4}(?:\s*ti|super)?)/i);
  if (rtxMatch) {
    return `RTX ${rtxMatch[1].toUpperCase().replace(/\s+/g, " ")}`;
  }

  const gtxMatch = cleanName.match(/gtx\s*(\d{3,4}(?:\s*ti)?)/i);
  if (gtxMatch) {
    return `GTX ${gtxMatch[1].toUpperCase().replace(/\s+/g, " ")}`;
  }

  const rxMatch = cleanName.match(/rx\s*(\d{3,4}(?:\s*xt|xtx)?)/i);
  if (rxMatch) {
    return `RX ${rxMatch[1].toUpperCase().replace(/\s+/g, " ")}`;
  }

  const arcMatch = cleanName.match(/arc\s*(a\d{3})/i);
  if (arcMatch) {
    return `Arc ${arcMatch[1].toUpperCase()}`;
  }

  return "UNKNOWN";
}

// RAM Capacity extraction and normalization
export function extractRamCapacity(name: string): string {
  const lower = name.toLowerCase();
  // Matches e.g. "16gb (2x8gb)" or "32gb (2x16gb)" or "16gb" or "8gb" or "2x 8gb"
  const kitMatch = lower.match(/\b(\d+)\s*x\s*(\d+)\s*(?:gb|g)\b/i);
  if (kitMatch) {
    const qty = parseInt(kitMatch[1], 10);
    const size = parseInt(kitMatch[2], 10);
    return `${qty * size}GB`;
  }
  const singleMatch = lower.match(/\b(\d+)\s*(?:gb|g|gib)\b/i);
  if (singleMatch) {
    const size = parseInt(singleMatch[1], 10);
    if ([4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 256].includes(size)) {
      return `${size}GB`;
    }
  }
  return "UNKNOWN";
}

// RAM Generation extraction and normalization (DDR3/DDR4/DDR5)
export function extractRamGeneration(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("ddr5")) return "DDR5";
  if (lower.includes("ddr4")) return "DDR4";
  if (lower.includes("ddr3")) return "DDR3";
  return "UNKNOWN";
}

// RAM Frequency extraction and normalization
export function extractRamFrequency(name: string): string {
  const match = name.match(/\b(\d{4})\s*(?:mhz|mt\/s)\b/i);
  if (match) {
    return `${match[1]}MHz`;
  }
  return "UNKNOWN";
}

// Motherboard Chipset extraction and normalization
export function extractMotherboardChipset(name: string): string {
  const patterns = [
    /\b([abzhx]\d{2,3})m?\b/gi,
  ];
  for (const pat of patterns) {
    const matches = name.match(pat);
    if (matches) {
      return matches[0].toUpperCase().replace(/M$/, "");
    }
  }
  return "UNKNOWN";
}

// PSU Wattage extraction and normalization
export function extractPsuWattage(name: string): string {
  const match = name.match(/\b(\d{3,4})\s*(?:w|watts)\b/i);
  if (match) {
    return `${match[1]}W`;
  }
  return "UNKNOWN";
}

// PSU Certification extraction and normalization
export function extractPsuCertification(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("gold")) return "80 Plus Gold";
  if (lower.includes("bronze")) return "80 Plus Bronze";
  if (lower.includes("white") || lower.includes("standard")) return "80 Plus White";
  if (lower.includes("platinum")) return "80 Plus Platinum";
  if (lower.includes("titanium")) return "80 Plus Titanium";
  if (lower.includes("80 plus") || lower.includes("80plus")) return "80 Plus Certified";
  return "UNKNOWN";
}

// Base product schema mapping common fields
export const BaseProductObject = z.object({
  source: z.string(),
  name: z.string().min(1),
  priceCash: PriceField,
  priceInstallment: PriceField,
  link: z.string().url(),
  image: z.string().url().or(z.string().optional().transform(v => v || "")),
  isWhiteLabel: z.boolean().default(false)
});

// Pure CPU Object schema
export const CpuProductObject = BaseProductObject.extend({
  type: z.literal("cpu"),
  specs: z.object({
    socket: z.string().optional()
  }).optional().default({})
});

// Pure GPU Object schema
export const GpuProductObject = BaseProductObject.extend({
  type: z.literal("gpu"),
  specs: z.object({
    vram: z.string().optional(),
    chipset: z.string().optional()
  }).optional().default({})
});

// Pure RAM Object schema
export const RamProductObject = BaseProductObject.extend({
  type: z.literal("ram"),
  specs: z.object({
    capacity: z.string().optional(),
    generation: z.string().optional(),
    frequency: z.string().optional()
  }).optional().default({})
});

// Pure Motherboard Object schema
export const MotherboardProductObject = BaseProductObject.extend({
  type: z.literal("motherboard"),
  specs: z.object({
    socket: z.string().optional(),
    chipset: z.string().optional()
  }).optional().default({})
});

// Pure PSU Object schema
export const PsuProductObject = BaseProductObject.extend({
  type: z.literal("psu"),
  specs: z.object({
    wattage: z.string().optional(),
    certification: z.string().optional()
  }).optional().default({})
});

// Union schema with refinement & transformations
export const ProductSchema = z.discriminatedUnion("type", [
  CpuProductObject,
  GpuProductObject,
  RamProductObject,
  MotherboardProductObject,
  PsuProductObject
])
  .refine((data) => !containsForbiddenTerms(data.name), {
    message: "Product name contains forbidden terms",
    path: ["name"]
  })
  .transform((data) => {
    const isWhiteLabel = data.isWhiteLabel || checkIsWhiteLabel(data.name);
    
    if (data.type === "cpu") {
      return {
        ...data,
        isWhiteLabel,
        specs: {
          socket: extractSocket(data.name)
        }
      };
    } else if (data.type === "gpu") {
      return {
        ...data,
        isWhiteLabel,
        specs: {
          vram: extractVram(data.name),
          chipset: extractGpuChipset(data.name)
        }
      };
    } else if (data.type === "ram") {
      return {
        ...data,
        isWhiteLabel,
        specs: {
          capacity: extractRamCapacity(data.name),
          generation: extractRamGeneration(data.name),
          frequency: extractRamFrequency(data.name)
        }
      };
    } else if (data.type === "motherboard") {
      return {
        ...data,
        isWhiteLabel,
        specs: {
          socket: extractSocket(data.name),
          chipset: extractMotherboardChipset(data.name)
        }
      };
    } else { // psu
      return {
        ...data,
        isWhiteLabel,
        specs: {
          wattage: extractPsuWattage(data.name),
          certification: extractPsuCertification(data.name)
        }
      };
    }
  });

export type Product = z.infer<typeof ProductSchema>;
