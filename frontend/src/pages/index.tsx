import React from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Navbar } from '@/components/Layout/Navbar';
import { ProductCatalog } from '@/components/Catalog/ProductCatalog';

export default function Home() {
  const { allProducts, loading, error } = useProducts();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <div className="text-xs text-zinc-500 tracking-widest uppercase">Carregando Catálogo de Produtos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-red-500 flex items-center justify-center font-mono p-4">
        <div className="border border-red-500/20 bg-red-950/10 p-6 rounded-lg max-w-md w-full text-center space-y-2">
          <div className="font-bold text-xs uppercase tracking-wider">Erro de Inicialização</div>
          <div className="text-xs text-zinc-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-mono">
      <Navbar itemCount={allProducts.length} />
      <ProductCatalog products={allProducts} />
    </div>
  );
}
