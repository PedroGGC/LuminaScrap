import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Cpu, Hammer, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  itemCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ itemCount }) => {
  const router = useRouter();

  const isCatalog = router.pathname === '/';
  const isBuilder = router.pathname === '/builder';

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/30 transition-colors">
            <Cpu size={18} />
          </div>
          <div>
            <span className="font-bold text-sm text-zinc-100 tracking-tight block leading-none">
              HARDWARE<span className="text-indigo-400">SCRAPER</span>
            </span>
            <span className="text-[10px] text-zinc-500 tracking-wider">
              {itemCount !== undefined ? `${itemCount} produtos ao vivo` : 'Catálogo & Builder'}
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-1">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isCatalog
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Catálogo Geral</span>
          </Link>

          <Link
            href="/builder"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isBuilder
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Hammer size={14} />
            <span>Montar PC (Builder)</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
