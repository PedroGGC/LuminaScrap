import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Cpu, Hammer, ShoppingBag, Radio } from 'lucide-react';

interface NavbarProps {
  itemCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ itemCount }) => {
  const router = useRouter();

  const isCatalog = router.pathname === '/';
  const isBuilder = router.pathname === '/builder';

  return (
    <header className="sticky top-0 z-50 bg-[#07090e]/85 backdrop-blur-xl border-b border-[#1b2030] px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative w-9 h-9 rounded-xl bg-[#0e111a] border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:text-cyan-400 transition-colors">
              <Cpu size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-100 tracking-tight block leading-none font-sans">
                HARDWARE<span className="text-gradient-indigo">SCRAPER</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 tracking-wider uppercase">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                {itemCount !== undefined ? `${itemCount} produtos ao vivo` : 'Catálogo & Builder'}
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#0d1018] border border-[#1b2030] rounded-xl p-1.5 shadow-inner">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isCatalog
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141926]'
            }`}
          >
            <ShoppingBag size={14} className={isCatalog ? 'text-white' : 'text-indigo-400'} />
            <span>Catálogo Geral</span>
          </Link>

          <Link
            href="/builder"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              isBuilder
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141926]'
            }`}
          >
            <Hammer size={14} className={isBuilder ? 'text-white' : 'text-cyan-400'} />
            <span>Montar PC (Builder)</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

