export interface EnrichedProductData {
  name: string;
  image: string;
  specs: Record<string, any>;
  isWhiteLabel: boolean;
  usedScraperApi: boolean;
  usedFallback: boolean;
}

const WHITE_LABEL_BRANDS = [
  'soyo', 'mllse', 'elsa', 'machinist', 'jingsha', 'huananzhi',
  'maxsun', 'kllisre', 'mingzhou', 'atermiter', 'pelong', 'jieshuo',
  'szmz', 'onyx', 'arsus', 'corn', 'resonate', 'veineda', 'sheli'
];

function checkIsWhiteLabel(name: string): boolean {
  const lower = name.toLowerCase();
  return WHITE_LABEL_BRANDS.some((brand) => new RegExp(`\\b${brand}\\b`, 'i').test(lower));
}

// Regex extractors for specs fallback
function extractSocket(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('am4')) return 'AM4';
  if (lower.includes('am5')) return 'AM5';
  const lgaMatch = name.match(/lga\s*(\d+)/i);
  if (lgaMatch) return `LGA${lgaMatch[1]}`;
  if (/\bryzen\s+[3579]?\s*(7\d{3}|8\d{3}|9\d{3})/i.test(name)) return 'AM5';
  if (/\bryzen\s+[3579]?\s*([12345]\d{3})/i.test(name)) return 'AM4';
  if (/\bcore\s*i[3579][- ]?(12\d{3}|13\d{3}|14\d{3})/i.test(name)) return 'LGA1700';
  if (/\bcore\s*i[3579][- ]?(10\d{3}|11\d{3})/i.test(name)) return 'LGA1200';
  if (/\b(b650|a620|x670|b850|x870)m?\b/i.test(name)) return 'AM5';
  if (/\b(a320|b350|x370|b450|x470|a520|b550|x570)m?\b/i.test(name)) return 'AM4';
  if (/\b(h610|b660|h670|z690|b760|z790)m?\b/i.test(name)) return 'LGA1700';
  return 'Não Informado';
}

function extractVram(name: string): string {
  const match = name.match(/\b(\d+)\s*(?:gb|g|gib)\b/i);
  return match ? `${match[1]} GB` : 'Não Informado';
}

function extractGpuChipset(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const rtxMatch = cleanName.match(/rtx\s*(\d{4}(?:\s*ti|\s*super)?)/i);
  if (rtxMatch) return `RTX ${rtxMatch[1].toUpperCase()}`;
  const gtxMatch = cleanName.match(/gtx\s*(\d{3,4}(?:\s*ti|\s*super)?)/i);
  if (gtxMatch) return `GTX ${gtxMatch[1].toUpperCase()}`;
  const rxMatch = cleanName.match(/rx\s*(\d{3,4}(?:\s*xtx|\s*xt)?)/i);
  if (rxMatch) return `RX ${rxMatch[1].toUpperCase()}`;
  return 'Não Informado';
}

function extractRamCapacity(name: string): string {
  const match = name.match(/\b(\d+)\s*(?:gb|g)\b/i);
  return match ? `${match[1]} GB` : 'Não Informado';
}

function extractRamGeneration(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ddr5')) return 'DDR5';
  if (lower.includes('ddr4')) return 'DDR4';
  if (lower.includes('ddr3')) return 'DDR3';
  return 'Não Informado';
}

function extractRamFrequency(name: string): string {
  const match = name.match(/\b(\d{4})\s*(?:mhz|mt\/s)\b/i);
  return match ? `${match[1]} MHz` : 'Não Informado';
}

function extractPsuWattage(name: string): string {
  const match = name.match(/\b(\d{3,4})\s*w\b/i);
  return match ? `${match[1]} W` : 'Não Informado';
}

function buildFallbackSpecs(type: string, name: string, rawSpecs: Record<string, any>): Record<string, any> {
  const specs: Record<string, any> = { ...rawSpecs };

  if (type === 'cpu') {
    specs.socket = specs.socket || specs.Socket || extractSocket(name);
  } else if (type === 'gpu') {
    specs.vram = specs.vram || specs.VRAM || extractVram(name);
    specs.chipset = specs.chipset || specs.Chipset || extractGpuChipset(name);
  } else if (type === 'motherboard') {
    specs.socket = specs.socket || specs.Socket || extractSocket(name);
    specs.chipset = specs.chipset || specs.Chipset || 'Não Informado';
  } else if (type === 'ram') {
    specs.capacity = specs.capacity || specs.Capacidade || extractRamCapacity(name);
    specs.generation = specs.generation || specs.Padrão || extractRamGeneration(name);
    specs.frequency = specs.frequency || specs.Frequência || extractRamFrequency(name);
  } else if (type === 'psu') {
    specs.wattage = specs.wattage || specs.Potência || extractPsuWattage(name);
    specs.certification = specs.certification || specs.Certificação || '80 Plus Certified';
  } else if (type === 'storage') {
    specs.capacity = specs.capacity || specs.Capacidade || 'Não Informado';
    specs.storageType = specs.storageType || specs['Tipo/Barramento'] || 'SSD NVMe M.2';
  }

  return specs;
}

export async function enrichProductWithScraperApi(
  targetUrl: string,
  type: string,
  rawTitle: string,
  rawSpecsFallback: Record<string, any>
): Promise<EnrichedProductData> {
  const apiKey = process.env.SCRAPER_API_KEY;
  const isWhiteLabel = checkIsWhiteLabel(rawTitle);

  // If no ScraperAPI key provided, use fallback immediately
  if (!apiKey || apiKey.trim() === '') {
    console.log('[ScraperAPI] Key not configured. Using Telegram worker fallback specs.');
    return {
      name: rawTitle,
      image: '',
      specs: buildFallbackSpecs(type, rawTitle, rawSpecsFallback),
      isWhiteLabel,
      usedScraperApi: false,
      usedFallback: true,
    };
  }

  try {
    const scraperUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&render=false`;
    
    // Set 8-second timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    console.log(`[ScraperAPI] Fetching HTML for ${targetUrl}...`);
    const response = await fetch(scraperUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ScraperAPI] Returned status ${response.status}. Triggering fallback.`);
      return {
        name: rawTitle,
        image: '',
        specs: buildFallbackSpecs(type, rawTitle, rawSpecsFallback),
        isWhiteLabel,
        usedScraperApi: true,
        usedFallback: true,
      };
    }

    const html = await response.text();

    // Extract og:image or twitter:image from HTML
    let extractedImage = '';
    const ogImageMatch =
      html.match(/<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image|twitter:image)["']/i);

    if (ogImageMatch && ogImageMatch[1]) {
      extractedImage = ogImageMatch[1].trim();
    }

    // Extract page title if available and clean it
    let extractedName = rawTitle;
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const cleanPageTitle = titleMatch[1].split('|')[0].split('-')[0].trim();
      if (cleanPageTitle.length >= 10) {
        extractedName = cleanPageTitle;
      }
    }

    const finalSpecs = buildFallbackSpecs(type, extractedName, rawSpecsFallback);

    return {
      name: extractedName,
      image: extractedImage,
      specs: finalSpecs,
      isWhiteLabel,
      usedScraperApi: true,
      usedFallback: false,
    };
  } catch (err: any) {
    console.warn(`[ScraperAPI] Request failed (${err?.message || err}). Using fallback specs.`);
    return {
      name: rawTitle,
      image: '',
      specs: buildFallbackSpecs(type, rawTitle, rawSpecsFallback),
      isWhiteLabel,
      usedScraperApi: true,
      usedFallback: true,
    };
  }
}
