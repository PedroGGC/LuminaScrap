import { useState, useEffect } from 'react';
import { ProductsData, BenchmarkScores, Product } from '@/types/hardware';

export function useProducts() {
  const [products, setProducts] = useState<ProductsData | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback para arquivo estático
      }
      const fallbackRes = await fetch('/produtos.json');
      if (!fallbackRes.ok) throw new Error('Falha ao carregar produtos');
      return await fallbackRes.json();
    };

    const fetchBenchmarks = async () => {
      try {
        const res = await fetch('/benchmarks.json');
        if (res.ok) return await res.json();
      } catch {
        // Ignora erro se benchmarks.json falhar
      }
      return {};
    };

    Promise.all([fetchProducts(), fetchBenchmarks()])
      .then(([rawProducts, benchmarksData]) => {
        let structuredProducts: ProductsData;
        let flatList: Product[] = [];

        if (Array.isArray(rawProducts)) {
          flatList = rawProducts;
          structuredProducts = {
            cpu: rawProducts.filter((p: Product) => p.type === 'cpu') as any,
            gpu: rawProducts.filter((p: Product) => p.type === 'gpu') as any,
            ram: rawProducts.filter((p: Product) => p.type === 'ram') as any,
            motherboard: rawProducts.filter((p: Product) => p.type === 'motherboard') as any,
            psu: rawProducts.filter((p: Product) => p.type === 'psu') as any,
            storage: rawProducts.filter((p: Product) => p.type === 'storage') as any,
            monitor: rawProducts.filter((p: Product) => p.type === 'monitor') as any,
            keyboard: rawProducts.filter((p: Product) => p.type === 'keyboard') as any,
          };
        } else {
          structuredProducts = {
            cpu: rawProducts.cpu || [],
            gpu: rawProducts.gpu || [],
            motherboard: rawProducts.motherboard || [],
            ram: rawProducts.ram || [],
            psu: rawProducts.psu || [],
            storage: rawProducts.storage || [],
            monitor: rawProducts.monitor || [],
            keyboard: rawProducts.keyboard || [],
          };
          flatList = [
            ...(rawProducts.cpu || []),
            ...(rawProducts.gpu || []),
            ...(rawProducts.motherboard || []),
            ...(rawProducts.ram || []),
            ...(rawProducts.psu || []),
            ...(rawProducts.storage || []),
            ...(rawProducts.monitor || []),
            ...(rawProducts.keyboard || []),
          ];
        }

        setProducts(structuredProducts);
        setAllProducts(flatList);
        setBenchmarks(benchmarksData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      });
  }, []);

  return { products, allProducts, benchmarks, loading, error };
}
