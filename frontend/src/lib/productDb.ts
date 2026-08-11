import { Redis } from '@upstash/redis';
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

const PRODUCTS_KEY = 'products';

function getRedisClient(): Redis | null {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return Redis.fromEnv();
    }
  } catch (err) {
    console.warn('[ProductDB] Upstash Redis credentials not configured. Using local JSON fallback.');
  }
  return null;
}

function getDbFilePath(): string {
  const relativePublic = path.join(process.cwd(), 'public', 'produtos.json');
  if (fs.existsSync(path.dirname(relativePublic))) {
    return relativePublic;
  }
  const frontendPublic = path.join(process.cwd(), 'frontend', 'public', 'produtos.json');
  return frontendPublic;
}

function loadProductsFromLocalFile(): DBProduct[] {
  const filePath = getDbFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, index: number) => {
          const normalizedLink = cleanUrl(item.link || '');
          const storeName = getStoreFromUrl(normalizedLink || item.link);
          let type = mapCategoryToType(item.category || item.type || '', item.name || '');
          if (
            item.name &&
            (item.name.toLowerCase().includes('gvgmall') ||
              item.name.toLowerCase().includes('chave windows') ||
              item.name.toLowerCase().includes('windows 11') ||
              item.name.toLowerCase().includes('windows 10') ||
              item.name.toLowerCase().includes('chave de ativação'))
          ) {
            type = 'software';
          }
          const slug = item.slug || item.id || generateProductSlug(item.name || '', type, item.specs);
          const nowIso = new Date().toISOString();

          const offers: Offer[] = Array.isArray(item.offers) && item.offers.length > 0
            ? item.offers.map((o: any) => ({
                ...o,
                source: getStoreFromUrl(o.link || normalizedLink),
                link: cleanUrl(o.link || normalizedLink)
              }))
            : [
                {
                  id: `off-${index}-${Date.now()}`,
                  source: storeName,
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
            source: storeName,
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

function saveProductsToLocalFile(products: DBProduct[]): void {
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ProductDB] Error saving to local JSON:', err);
  }
}

export function getStoreFromUrl(urlStr: string, existingSource?: string): string {
  if (!urlStr) return existingSource || 'Loja Online';
  try {
    let lowerUrl = urlStr.toLowerCase();
    try {
      lowerUrl = decodeURIComponent(lowerUrl);
    } catch {}

    if (lowerUrl.includes('kabum.com.br') || lowerUrl.includes('kabum')) return 'KaBuM!';
    if (lowerUrl.includes('terabyteshop.com.br') || lowerUrl.includes('terabyte')) return 'Terabyte';
    if (lowerUrl.includes('pichau.com.br') || lowerUrl.includes('pichau')) return 'Pichau';
    if (lowerUrl.includes('amazon') || lowerUrl.includes('amzn') || lowerUrl.includes('link.amazon')) return 'Amazon';
    if (lowerUrl.includes('mercadolivre.com.br') || lowerUrl.includes('mercadolibre') || lowerUrl.includes('mercadolivre') || lowerUrl.includes('meli.la')) return 'Mercado Livre';
    if (lowerUrl.includes('magazineluiza.com.br') || lowerUrl.includes('magalu') || lowerUrl.includes('magazine')) return 'Magazine Luiza';
    if (lowerUrl.includes('aliexpress.com') || lowerUrl.includes('aliexpress')) return 'AliExpress';
    if (lowerUrl.includes('shopee.com.br') || lowerUrl.includes('shopee')) return 'Shopee';

    const hostname = new URL(urlStr).hostname.toLowerCase();
    const cleanHost = hostname.replace(/^www\./, '');
    const mainDomain = cleanHost.split('.')[0];

    const shorteners = ['tidd', 'tido', 'tiddly', 'aoferta', 'bit', 'tinyurl', 'cutt', 't', 'awin1', 'lomadee', 'ad', 'atdmt', 's'];
    if (shorteners.includes(mainDomain)) {
      if (existingSource && !shorteners.includes(existingSource.toLowerCase()) && existingSource !== 'Outros') {
        return existingSource;
      }
      return 'Loja Online';
    }

    if (mainDomain && mainDomain.length > 1) {
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
    return existingSource || 'Loja Online';
  } catch {
    return existingSource || 'Loja Online';
  }
}

export function mapCategoryToType(category: string, title?: string): string {
  const cat = (category || '').toLowerCase().trim();
  const t = (title || '').toLowerCase().trim();

  // Check if title or category represents a smartphone/mobile/tablet device
  const isMobileOrTablet =
    t.includes('celular') ||
    t.includes('smartphone') ||
    t.includes('iphone') ||
    t.includes('galaxy') ||
    t.includes('realme') ||
    t.includes('xiaomi') ||
    t.includes('redmi') ||
    t.includes('poco') ||
    t.includes('motorola') ||
    t.includes('tablet') ||
    t.includes('ipad') ||
    t.includes('6000mah') ||
    t.includes('5000mah') ||
    t.includes('4500mah');

  if (isMobileOrTablet) {
    return 'other';
  }

  // Check if title or category is software / key advertisement
  if (
    t.includes('gvgmall') ||
    t.includes('chave windows') ||
    t.includes('windows 11') ||
    t.includes('windows 10') ||
    t.includes('chave de ativação') ||
    t.includes('licença windows') ||
    t.includes('office 365') ||
    t.includes('microsoft office') ||
    cat.includes('software') ||
    cat.includes('chave')
  ) {
    return 'software';
  }

  // Check if title represents a prebuilt PC or laptop/desktop system
  const isPrebuilt =
    t.includes('pc gamer') ||
    t.includes('pc home') ||
    t.includes('pc montado') ||
    t.includes('computador') ||
    t.includes('desktop') ||
    t.includes('notebook') ||
    t.includes('laptop') ||
    t.includes('kit upgrade') ||
    (t.includes('gb de ram') && (t.includes('intel') || t.includes('ryzen') || t.includes('core i') || t.includes('ssd')));

  if (isPrebuilt) {
    return 'other';
  }

  if (cat.includes('processador') || cat === 'cpu' || t.includes('processador')) return 'cpu';
  if (cat.includes('placa de vídeo') || cat.includes('placa de video') || cat === 'gpu' || t.includes('rtx ') || t.includes('rx ') || t.includes('gtx ')) return 'gpu';
  if (cat.includes('memória') || cat.includes('memoria') || cat === 'ram') return 'ram';
  if (cat.includes('placa-mãe') || cat.includes('placa mãe') || cat.includes('placa mae') || cat === 'motherboard') return 'motherboard';
  if (cat.includes('fonte') || cat === 'psu' || cat.includes('power supply') || cat === 'power-supply') return 'psu';
  if (cat.includes('monitor') || t.includes('monitor')) return 'monitor';
  if (cat.includes('ssd') || cat.includes('hd') || cat.includes('armazenamento') || cat.includes('storage') || cat.includes('nvme')) return 'storage';
  if (cat.includes('gabinete') || cat === 'case') return 'case';
  if (cat.includes('teclado') || cat === 'keyboard' || t.includes('teclado')) return 'keyboard';
  if (cat.includes('mouse') || t.includes('mouse')) return 'mouse';

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

export function sanitizeProductStores(products: DBProduct[]): DBProduct[] {
  return products.map((p) => {
    const cleanSource = getStoreFromUrl(p.link, p.source);
    const correctType = mapCategoryToType(p.type, p.name);
    const cleanOffers = Array.isArray(p.offers)
      ? p.offers.map((o) => ({
          ...o,
          source: getStoreFromUrl(o.link || p.link, o.source),
        }))
      : [];

    return {
      ...p,
      type: correctType,
      source: cleanSource,
      offers: cleanOffers,
    };
  });
}

export async function loadProducts(): Promise<DBProduct[]> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const data = await redis.get<DBProduct[]>(PRODUCTS_KEY);
      if (Array.isArray(data) && data.length > 0) {
        return sanitizeProductStores(data);
      }
    } catch (err) {
      console.error('[ProductDB Redis] Erro ao carregar produtos do Upstash Redis:', err);
    }
  }

  const localProducts = sanitizeProductStores(loadProductsFromLocalFile());
  if (localProducts.length > 0 && redis) {
    try {
      await redis.set(PRODUCTS_KEY, localProducts);
      console.log(`[ProductDB Redis] Migrados ${localProducts.length} produtos do produtos.json para o Upstash Redis.`);
    } catch (err) {
      console.error('[ProductDB Redis] Erro na migração para Redis:', err);
    }
  }
  return localProducts;
}

export async function saveProducts(products: DBProduct[]): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(PRODUCTS_KEY, products);
    } catch (err) {
      console.error('[ProductDB Redis] Erro ao salvar produtos no Upstash Redis:', err);
    }
  }

  saveProductsToLocalFile(products);
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
