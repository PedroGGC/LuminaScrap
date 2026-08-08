import type { NextApiRequest, NextApiResponse } from 'next';
import {
  loadProducts,
  saveProducts,
  findProduct,
  mapCategoryToType,
  generateProductSlug,
  cleanUrl,
  DBProduct,
  Offer,
} from '@/lib/productDb';
import { enrichProductWithScraperApi } from '@/lib/scraperService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const products = loadProducts();
    const totalOffers = products.reduce((acc, p) => acc + (p.offers?.length || 1), 0);
    return res.status(200).json({
      total_products: products.length,
      total_offers: totalOffers,
      categories: Array.from(new Set(products.map((p) => p.type))),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, raw_text, price, link, category, coupon, raw_specs_regex, source, timestamp } = req.body;

    if (!price || !link) {
      return res.status(400).json({ error: 'Missing required fields: price, link' });
    }

    const itemTitle = (title || raw_text || 'Produto Hardware').trim();
    const type = mapCategoryToType(category || '');
    const normalizedLink = cleanUrl(link);
    const storeSource = source || 'Telegram';
    const numPrice = typeof price === 'number' ? price : parseFloat(price);

    const products = loadProducts();
    const slug = generateProductSlug(itemTitle, type, raw_specs_regex);

    // 1. CHECAGEM DE CACHE NO BANCO DE DADOS
    const matchResult = findProduct(products, slug, normalizedLink, itemTitle, type);

    if (matchResult.found && matchResult.product) {
      // PRODUTO JÁ EXISTE NO BANCO -> Registra/Atualiza a oferta (0 requisições externas!)
      const product = matchResult.product;
      const existingOfferIndex = product.offers.findIndex(
        (o) => cleanUrl(o.link) === normalizedLink || o.source.toLowerCase() === storeSource.toLowerCase()
      );

      const nowIso = new Date().toISOString();

      if (existingOfferIndex >= 0) {
        product.offers[existingOfferIndex] = {
          ...product.offers[existingOfferIndex],
          priceCash: numPrice,
          priceInstallment: Math.round(numPrice * 1.08 * 100) / 100,
          link: normalizedLink,
          coupon: coupon || product.offers[existingOfferIndex].coupon || '',
          lastSeenAt: nowIso,
        };
      } else {
        product.offers.push({
          id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          source: storeSource,
          priceCash: numPrice,
          priceInstallment: Math.round(numPrice * 1.08 * 100) / 100,
          link: normalizedLink,
          coupon: coupon || '',
          lastSeenAt: nowIso,
        });
      }

      // Atualiza oferta principal (melhor preço) no topo do produto
      const bestOffer = product.offers.reduce(
        (best, cur) => (cur.priceCash < best.priceCash ? cur : best),
        product.offers[0]
      );

      product.priceCash = bestOffer.priceCash;
      product.priceInstallment = bestOffer.priceInstallment;
      product.link = bestOffer.link;
      product.source = bestOffer.source;
      product.updatedAt = nowIso;

      saveProducts(products);

      return res.status(200).json({
        status: 'updated',
        action: 'offer_updated_cache_hit',
        requests_used: 0,
        product_id: product.id,
        slug: product.slug,
        current_price: product.priceCash,
      });
    }

    // 2. PRODUTO INÉDITO (NÃO EXISTE NO BANCO) -> Executa Lazy Loading via ScraperAPI (com Fallback)
    console.log(`[Lazy Loading] Produto inédito detectado: "${itemTitle}". Consultando ScraperAPI...`);
    const enriched = await enrichProductWithScraperApi(
      normalizedLink,
      type,
      itemTitle,
      raw_specs_regex || {}
    );

    const nowIso = new Date().toISOString();
    const newOffer: Offer = {
      id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source: storeSource,
      priceCash: numPrice,
      priceInstallment: Math.round(numPrice * 1.08 * 100) / 100,
      link: normalizedLink,
      coupon: coupon || '',
      lastSeenAt: nowIso,
    };

    const newProduct: DBProduct = {
      id: slug,
      slug: slug,
      name: enriched.name || itemTitle,
      type: type,
      image: enriched.image || '',
      isWhiteLabel: enriched.isWhiteLabel,
      specs: enriched.specs,
      offers: [newOffer],
      priceCash: numPrice,
      priceInstallment: Math.round(numPrice * 1.08 * 100) / 100,
      link: normalizedLink,
      source: storeSource,
      updatedAt: nowIso,
      createdAt: nowIso,
    };

    products.push(newProduct);
    saveProducts(products);

    return res.status(201).json({
      status: 'created',
      action: 'product_created_lazy_loaded',
      requests_used: enriched.usedScraperApi ? 1 : 0,
      product_id: newProduct.id,
      slug: newProduct.slug,
      image_extracted: !!enriched.image,
      fallback_used: enriched.usedFallback,
    });
  } catch (error) {
    console.error('[API /api/offers Error]:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
