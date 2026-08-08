import { useState, useEffect } from 'react';
import { ProductsData, BenchmarkScores, Product } from '@/types/hardware';

export function useProducts() {
  const [products, setProducts] = useState<ProductsData | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/produtos.json').then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar produtos.json');
        return res.json();
      }),
      fetch('/benchmarks.json').then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar benchmarks.json');
        return res.json();
      }),
    ])
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
          };
        } else {
          structuredProducts = rawProducts;
          flatList = [
            ...(rawProducts.cpu || []),
            ...(rawProducts.gpu || []),
            ...(rawProducts.motherboard || []),
            ...(rawProducts.ram || []),
            ...(rawProducts.psu || []),
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

