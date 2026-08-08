import fs from 'fs';
import path from 'path';

export interface Offer {
  id: string;
  source: string;
  priceCash: number;
  priceInstallment: number;
  link: string;
  coupon?: string;
  lastSeenAt: string;
}

export interface DBProduct {
  id: string;
  slug: string;
  name: string;
  type: string;
  image: string;
  isWhiteLabel: boolean;
  specs: Record<string, any>;
  offers: Offer[];
  priceCash: number;
  priceInstallment: number;
  link: string;
  source: string;
  updatedAt: string;
  createdAt: string;
}

// Single Source of Truth file path: frontend/public/produtos.json
function getDbFilePath(): string {
  // If running from frontend directory or parent workspace directory
  const relativePublic = path.join(process.cwd(), 'public', 'produtos.json');
  if (fs.existsSync(path.dirname(relativePublic))) {
    return relativePublic;
  }
  const frontendPublic = path.join(process.cwd(), 'frontend', 'public', 'produtos.json');
  return frontendPublic;
}

// Rigid Category Normalization (category -> type)
export function mapCategoryToType(category: string): string {
  const cat = (category || '').toLowerCase().trim();
  
  if (cat.includes('processador') || cat === 'cpu') return 'cpu';
  if (cat.includes('placa de vídeo') || cat.includes('placa de video') || cat === 'gpu') return 'gpu';
  if (cat.includes('memória') || cat.includes('memoria') || cat === 'ram') return 'ram';
  if (cat.includes('placa-mãe') || cat.includes('placa mãe') || cat.includes('placa mae') || cat === 'motherboard') return 'motherboard';
  if (cat.includes('fonte') || cat === 'psu' || cat.includes('power supply') || cat === 'power-supply') return 'psu';
  if (cat.includes('monitor')) return 'monitor';
  if (cat.includes('ssd') || cat.includes('hd') || cat.includes('armazenamento') || cat.includes('storage') || cat.includes('nvme')) return 'storage';
  if (cat.includes('gabinete') || cat === 'case') return 'case';
  if (cat.includes('teclado') || cat === 'keyboard') return 'keyboard';
  if (cat.includes('mouse')) return 'mouse';

  return 'other';
}

export function cleanUrl(urlStr: string): string {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return urlStr.split('?')[0].split('#')[0].trim();
  }
}

export function generateProductSlug(title: string, type: string, specs?: Record<string, any>): string {
  let clean = title.toLowerCase();

  clean = clean.replace(/\[.*?\]|\(.*?\)/g, ' ');
  clean = clean.replace(/promoção|promocao|oferta|frete grátis|frete gratis|cupom|loja|kabum|terabyte|pichau|amazon|mercado livre/gi, ' ');
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  clean = clean.replace(/[^a-z0-9\s-]/g, ' ');
  clean = clean.replace(/\s+/g, '-').trim();

  const parts: string[] = [type];

  if (type === 'gpu') {
    const gpuMatch = clean.match(/(rtx-\d{4}-ti-super|rtx-\d{4}-super|rtx-\d{4}-ti|rtx-\d{4}|gtx-\d{4}|gtx-\d{3}|rx-\d{4}-xtx|rx-\d{4}-xt|rx-\d{4}|arc-[ab]\d{3})/i);
    if (gpuMatch) parts.push(gpuMatch[1]);
    const vramMatch = clean.match(/(\d{1,2}gb)/i);
    if (vramMatch) parts.push(vramMatch[1]);
  } else if (type === 'cpu') {
    const cpuMatch = clean.match(/(ryzen-[3579]-\d{4}[x3d]*|core-i[3579]-\d{4,5}[kfa]*|i[3579]-\d{4,5}|r[3579]-\d{4})/i);
    if (cpuMatch) parts.push(cpuMatch[1]);
  } else if (type === 'motherboard') {
    const mbMatch = clean.match(/(a520|b550|b650|a620|x670|b760|z790|h610|b450)m?/i);
    if (mbMatch) parts.push(mbMatch[0]);
  } else if (type === 'ram') {
    const ddrMatch = clean.match(/(ddr[45])/i);
    if (ddrMatch) parts.push(ddrMatch[1]);
    const capMatch = clean.match(/(\d{1,2}gb)/i);
    if (capMatch) parts.push(capMatch[1]);
  } else if (type === 'psu') {
    const psuMatch = clean.match(/(\d{3,4}w)/i);
    if (psuMatch) parts.push(psuMatch[1]);
  }

  if (parts.length > 1) {
    return parts.join('-');
  }

  return clean.slice(0, 60).replace(/-+$/, '');
}

export function loadProducts(): DBProduct[] {
  const filePath = getDbFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, index: number) => {
          const normalizedLink = cleanUrl(item.link || '');
          const type = item.type || mapCategoryToType(item.category || '');
          const slug = item.slug || item.id || generateProductSlug(item.name || '', type, item.specs);
          const nowIso = new Date().toISOString();

          const offers: Offer[] = Array.isArray(item.offers) && item.offers.length > 0
            ? item.offers
            : [
                {
                  id: `off-${index}-${Date.now()}`,
                  source: item.source || 'Scraper',
                  priceCash: item.priceCash || 0,
                  priceInstallment: item.priceInstallment || item.priceCash || 0,
                  link: normalizedLink,
                  coupon: item.coupon || '',
                  lastSeenAt: item.updatedAt || nowIso
                }
              ];

          return {
            id: item.id || slug,
            slug: slug,
            name: item.name || 'Produto sem nome',
            type: type,
            image: item.image || '',
            isWhiteLabel: !!item.isWhiteLabel,
            specs: item.specs || {},
            offers: offers,
            priceCash: item.priceCash || 0,
            priceInstallment: item.priceInstallment || item.priceCash || 0,
            link: normalizedLink,
            source: item.source || 'Scraper',
            updatedAt: item.updatedAt || nowIso,
            createdAt: item.createdAt || nowIso
          };
        });
      }
    } catch (err) {
      console.error(`[ProductDB] Error reading ${filePath}:`, err);
    }
  }
  return [];
}

export function saveProducts(products: DBProduct[]): void {
  const filePath = getDbFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
}

export function findProduct(
  products: DBProduct[],
  slug: string,
  normalizedLink: string,
  title: string,
  type: string
): { found: boolean; product?: DBProduct } {
  const urlMatch = products.find((p) =>
    p.offers.some((o) => cleanUrl(o.link) === normalizedLink) || cleanUrl(p.link) === normalizedLink
  );
  if (urlMatch) return { found: true, product: urlMatch };

  const slugMatch = products.find((p) => p.slug === slug || p.id === slug);
  if (slugMatch) return { found: true, product: slugMatch };

  const lowerTitle = title.toLowerCase();
  const nameMatch = products.find((p) => {
    if (p.type !== type) return false;
    const lowerPName = p.name.toLowerCase();
    return lowerPName.includes(lowerTitle) || lowerTitle.includes(lowerPName);
  });
  if (nameMatch) return { found: true, product: nameMatch };

  return { found: false };
}
