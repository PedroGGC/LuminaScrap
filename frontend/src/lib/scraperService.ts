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

function getCategoryPlaceholder(type: string): string {
  const t = (type || '').toLowerCase();
  if (t === 'cpu') return 'https://placehold.co/600x400/1e1b4b/818cf8?text=CPU+Processor';
  if (t === 'gpu') return 'https://placehold.co/600x400/064e3b/34d399?text=Graphics+Card';
  if (t === 'motherboard') return 'https://placehold.co/600x400/701a75/f0abfc?text=Motherboard';
  if (t === 'ram') return 'https://placehold.co/600x400/1e293b/94a3b8?text=RAM+Memory';
  if (t === 'psu') return 'https://placehold.co/600x400/78350f/fbbf24?text=Power+Supply';
  if (t === 'storage') return 'https://placehold.co/600x400/134e4a/2dd4bf?text=Storage+SSD';
  return 'https://placehold.co/600x400/1a1a1a/ffffff?text=Hardware';
}

function formatImageUrl(urlStr: string, targetUrl: string): string {
  if (!urlStr) return '';
  let cleaned = urlStr.trim();
  if (cleaned.startsWith('//')) {
    return `https:${cleaned}`;
  }
  if (cleaned.startsWith('/')) {
    try {
      const parsed = new URL(targetUrl);
      return `${parsed.origin}${cleaned}`;
    } catch {
      return cleaned;
    }
  }
  return cleaned;
}

export function normalizeAmazonUrl(urlStr: string): string {
  if (!urlStr) return urlStr;
  const lower = urlStr.toLowerCase();
  if (lower.includes('amazon') || lower.includes('amzn') || lower.includes('link.amazon')) {
    const asinMatch = urlStr.match(/\b([B0-9][A-Z0-9]{9})\b/i);
    if (asinMatch && asinMatch[1]) {
      const asin = asinMatch[1].toUpperCase();
      const canonical = `https://www.amazon.com.br/dp/${asin}`;
      console.log(`[ScraperAPI] Amazon ASIN detectado (${asin}). Normalizando URL para: ${canonical}`);
      return canonical;
    }
  }
  return urlStr;
}

const BANNER_BLACKLIST_TERMS = [
  'banner', 'oferta', 'ofertas', 'campaign', 'header', 'logo', 'prime',
  'stripe', 'promotion', '600x120', 'sprite', 'icon', 'button', 'badge',
  'nav-', 'footer', 'hero-', 'ads-', 'advertisement'
];

function isValidProductImage(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string' || urlStr.trim().length <= 5) return false;
  const lower = urlStr.toLowerCase();
  return !BANNER_BLACKLIST_TERMS.some((term) => lower.includes(term));
}

function extractAmazonImage(html: string, targetUrl: string): string {
  if (!html) return '';

  // a) Elementos #landingImage ou #imgBlkFront (data-old-hires ou src)
  const landingImageMatch =
    html.match(/id=["']landingImage["'][^>]*data-old-hires=["']([^"']+)["']/i) ||
    html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/id=["']imgBlkFront["'][^>]*data-old-hires=["']([^"']+)["']/i) ||
    html.match(/id=["']imgBlkFront["'][^>]*src=["']([^"']+)["']/i);

  if (landingImageMatch && landingImageMatch[1]) {
    const candidate = formatImageUrl(landingImageMatch[1].trim(), targetUrl);
    if (isValidProductImage(candidate)) {
      console.log('[Amazon Scraper] Imagem principal extraída via seletor de elemento:', candidate);
      return candidate;
    } else {
      console.log('[Amazon Scraper] Banner ignorado, buscando seletor interno...');
    }
  }

  // b) Atributo data-a-dynamic-image="{...}"
  const dynamicMatch = html.match(/data-a-dynamic-image=["'](\{.*?\}|&quot;\{.*?\}&quot;)["']/i);
  if (dynamicMatch && dynamicMatch[1]) {
    try {
      const decodedJson = dynamicMatch[1].replace(/&quot;/g, '"');
      const parsedObj = JSON.parse(decodedJson);
      const urls = Object.keys(parsedObj);
      for (const rawUrl of urls) {
        const candidate = formatImageUrl(rawUrl, targetUrl);
        if (isValidProductImage(candidate)) {
          console.log('[Amazon Scraper] Imagem principal extraída via data-a-dynamic-image:', candidate);
          return candidate;
        }
      }
    } catch {
      // Ignora erro no parse do JSON dinâmico
    }
  }

  // c) Regex CDN Amazon m.media-amazon.com/images/I/
  const amazonCdnMatches = html.matchAll(/https?:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%_\-]+\.(?:jpg|jpeg|png|webp)/gi);
  for (const match of Array.from(amazonCdnMatches)) {
    if (match[0]) {
      const candidate = formatImageUrl(match[0].trim(), targetUrl);
      if (isValidProductImage(candidate)) {
        console.log('[Amazon Scraper] Imagem principal extraída via CDN Regex:', candidate);
        return candidate;
      }
    }
  }

  // d) og:image Meta Tag se passar na blacklist
  const ogMatch =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

  if (ogMatch && ogMatch[1]) {
    const candidate = formatImageUrl(ogMatch[1].trim(), targetUrl);
    if (isValidProductImage(candidate)) {
      console.log('[Amazon Scraper] Imagem principal extraída via og:image validador:', candidate);
      return candidate;
    } else {
      console.log('[Amazon Scraper] Banner ignorado em og:image, buscando seletor interno...');
    }
  }

  return '';
}

function extractImageUrlFromHtml(html: string, targetUrl: string): string {
  if (!html) return '';

  const isAmazon = targetUrl.toLowerCase().includes('amazon') || targetUrl.toLowerCase().includes('amzn') || targetUrl.toLowerCase().includes('link.amazon');
  if (isAmazon) {
    const amazonImg = extractAmazonImage(html, targetUrl);
    if (amazonImg) return amazonImg;
  }

  // 1. Meta Tag og:image
  const ogImageMatch =
    html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);

  if (ogImageMatch && ogImageMatch[1]) {
    const candidate = formatImageUrl(ogImageMatch[1].trim(), targetUrl);
    if (isValidProductImage(candidate)) {
      return candidate;
    }
  }

  // 2. Schema JSON-LD (<script type="application/ld+json">) - chave "image"
  try {
    const jsonLdMatches = Array.from(
      html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    );
    for (const match of jsonLdMatches) {
      if (!match[1]) continue;
      try {
        const parsed = JSON.parse(match[1].trim());
        const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] ? parsed['@graph'] : [parsed]);

        for (const item of items) {
          if (item && (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct' || item['@type'] === 'ItemPage')) {
            let img = item.image || (item.mainEntity && item.mainEntity.image);
            if (Array.isArray(img)) img = img[0];
            if (typeof img === 'object' && img !== null) img = img.url || img.contentUrl;
            if (typeof img === 'string') {
              const candidate = formatImageUrl(img, targetUrl);
              if (isValidProductImage(candidate)) {
                return candidate;
              }
            }
          }
        }
      } catch {
        // Ignora erros pontuais no parse JSON-LD
      }
    }
  } catch {
    // Ignora falhas no match de JSON-LD
  }

  // 3. Meta Tags OpenGraph & Twitter alternativas
  const metaRegexes = [
    /<meta\s+(?:property|name)=["'](?:og:image:secure_url|twitter:image)["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["'](?:og:image:secure_url|twitter:image)["']/i,
    /<meta\s+property=["']og:image:url["']\s+content=["']([^"']+)["']/i,
  ];

  for (const regex of metaRegexes) {
    const metaMatch = html.match(regex);
    if (metaMatch && metaMatch[1]) {
      const candidate = formatImageUrl(metaMatch[1].trim(), targetUrl);
      if (isValidProductImage(candidate)) {
        return candidate;
      }
    }
  }

  // 4. Regex para domínios de imagens conhecidos em e-commerces
  const cdnRegexes = [
    /https?:\/\/(?:images|static)\.kabum\.com\.br\/[^\s"'>]+\.(?:jpg|jpeg|png|webp)/i,
    /https?:\/\/img\.terabyteshop\.com\.br\/[^\s"'>]+\.(?:jpg|jpeg|png|webp)/i,
    /https?:\/\/media\.pichau\.com\.br\/[^\s"'>]+\.(?:jpg|jpeg|png|webp)/i,
    /https?:\/\/m\.media-amazon\.com\/images\/I\/[^\s"'>]+\.(?:jpg|jpeg|png|webp)/i,
    /https?:\/\/http2\.mlstatic\.com\/[^\s"'>]+\.(?:jpg|jpeg|png|webp)/i,
  ];

  for (const cdnRegex of cdnRegexes) {
    const cdnMatch = html.match(cdnRegex);
    if (cdnMatch && cdnMatch[0]) {
      const candidate = formatImageUrl(cdnMatch[0].trim(), targetUrl);
      if (isValidProductImage(candidate)) {
        return candidate;
      }
    }
  }

  return '';
}

// Regex extractors para especificações técnicas de fallback
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
  rawTargetUrl: string,
  type: string,
  rawTitle: string,
  rawSpecsFallback: Record<string, any>
): Promise<EnrichedProductData> {
  const targetUrl = normalizeAmazonUrl(rawTargetUrl);
  const apiKey = process.env.SCRAPER_API_KEY;
  const isWhiteLabel = checkIsWhiteLabel(rawTitle);
  const categoryPlaceholder = getCategoryPlaceholder(type);

  if (!apiKey || apiKey.trim() === '') {
    console.log('[ScraperAPI] Key not configured. Using Telegram worker fallback specs and category placeholder.');
    return {
      name: rawTitle,
      image: categoryPlaceholder,
      specs: buildFallbackSpecs(type, rawTitle, rawSpecsFallback),
      isWhiteLabel,
      usedScraperApi: false,
      usedFallback: true,
    };
  }

  let html = '';

  try {
    // 1. Primeira Tentativa: ScraperAPI simples (country_code=br)
    const initialUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&country_code=br&render=false`;
    
    let controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 8000);

    console.log(`[ScraperAPI] Fetching HTML for ${targetUrl} (BR proxy)...`);
    let response = await fetch(initialUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      html = await response.text();
    }

    const isCloudflare =
      !response.ok ||
      response.status === 403 ||
      response.status === 429 ||
      html.includes('Cloudflare') ||
      html.includes('Access Denied') ||
      html.includes('Attention Required') ||
      html.includes('Just a moment...');

    // 2. Retry com render_js=true se ocorreu 403/429/Cloudflare
    if (isCloudflare) {
      console.warn('[ScraperAPI] Status 403/429 ou Cloudflare detectado. Tentando novamente com render_js=true...');
      
      const retryUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&country_code=br&render_js=true`;
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000); // 15s para renderização JS

      response = await fetch(retryUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        html = await response.text();
        const retryCloudflare = html.includes('Cloudflare') || html.includes('Access Denied');
        if (!retryCloudflare) {
          console.log('[ScraperAPI] Retry efetuado com sucesso (JS Render)');
        } else {
          console.warn('[ScraperAPI] Bloqueio persistente (403). Usando imagem fallback de categoria.');
        }
      } else {
        console.warn(`[ScraperAPI] Bloqueio persistente (${response.status}). Usando imagem fallback de categoria.`);
      }
    } else {
      console.log('[ScraperAPI Response Snippet]:', html.substring(0, 300));
    }

    // 3. Extração da Imagem Real ou Fallback Elegante de Categoria
    const extractedImageRaw = extractImageUrlFromHtml(html, targetUrl);
    const finalImage = extractedImageRaw || categoryPlaceholder;

    if (extractedImageRaw) {
      console.log('[ScraperAPI] URL da imagem extraída:', finalImage);
    } else {
      console.warn('[ScraperAPI] Nenhuma imagem no HTML. Usando imagem fallback de categoria.');
    }

    let extractedName = rawTitle;
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const cleanPageTitle = titleMatch[1].split('|')[0].split('-')[0].trim();
      if (cleanPageTitle.length >= 10 && !cleanPageTitle.includes('Cloudflare') && !cleanPageTitle.includes('Access Denied')) {
        extractedName = cleanPageTitle;
      }
    }

    const finalSpecs = buildFallbackSpecs(type, extractedName, rawSpecsFallback);

    return {
      name: extractedName,
      image: finalImage,
      specs: finalSpecs,
      isWhiteLabel,
      usedScraperApi: true,
      usedFallback: !extractedImageRaw,
    };
  } catch (err: any) {
    console.warn(`[ScraperAPI] Request failed (${err?.message || err}). Usando imagem fallback de categoria.`);
    return {
      name: rawTitle,
      image: categoryPlaceholder,
      specs: buildFallbackSpecs(type, rawTitle, rawSpecsFallback),
      isWhiteLabel,
      usedScraperApi: true,
      usedFallback: true,
    };
  }
}
