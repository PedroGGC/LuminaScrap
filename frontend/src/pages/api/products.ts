import type { NextApiRequest, NextApiResponse } from 'next';
import { loadProducts } from '@/lib/productDb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const products = await loadProducts();
    return res.status(200).json(products);
  } catch (error) {
    console.error('[API /api/products Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
