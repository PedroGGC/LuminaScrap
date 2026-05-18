'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Search, Filter, ArrowUpDown, Loader2 } from 'lucide-react';

interface Notebook {
  id: string;
  nome: string;
  site: string;
  cpu: string | null;
  gpu: string | null;
  ram: string | null;
  storageSize: string | null;
  marca: string | null;
  price: number | null;
  priceFormatted?: string;
}

const SITES = ['kabum', 'mercadolivre'];
const CPUS = ['i3', 'i5', 'i7', 'i9', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'];
const GPUS = ['RTX 4050', 'RTX 4060', 'RTX 4070', 'RTX 4080', 'RTX 4090', 'GTX', 'Integrated'];
const RAMS = ['8GB', '16GB', '32GB', '64GB'];

function formatPrice(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

const columns: ColumnDef<Notebook>[] = [
  {
    accessorKey: 'nome',
    header: 'Produto',
    cell: ({ row }) => (
      <div className="max-w-xs truncate font-medium">{row.getValue('nome')}</div>
    ),
  },
  {
    accessorKey: 'marca',
    header: 'Marca',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
        {row.getValue('marca') || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'cpu',
    header: 'CPU',
    cell: ({ row }) => <span className="text-zinc-400">{row.getValue('cpu') || '-'}</span>,
  },
  {
    accessorKey: 'gpu',
    header: 'GPU',
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400">
        {row.getValue('gpu') || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'ram',
    header: 'RAM',
    cell: ({ row }) => <span className="text-zinc-400">{row.getValue('ram') || '-'}</span>,
  },
  {
    accessorKey: 'storageSize',
    header: 'Armazenamento',
    cell: ({ row }) => <span className="text-zinc-400">{row.getValue('storageSize') || '-'}</span>,
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 hover:text-white"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Preço
        <ArrowUpDown className="w-3 h-3" />
      </button>
    ),
    cell: ({ row }) => {
      const price = row.getValue('price') as number;
      return price ? (
        <span className="font-semibold text-emerald-400">{formatPrice(price)}</span>
      ) : (
        <span className="text-zinc-500">-</span>
      );
    },
  },
  {
    accessorKey: 'site',
    header: 'Loja',
    cell: ({ row }) => (
      <span className="capitalize text-zinc-400">{row.getValue('site')}</span>
    ),
  },
];

function NotebookTableContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [site, setSite] = useState(searchParams.get('site') || '');
  const [cpu, setCpu] = useState(searchParams.get('cpu') || '');
  const [gpu, setGpu] = useState(searchParams.get('gpu') || '');
  const [ram, setRam] = useState(searchParams.get('ram') || '');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/notebooks`);
        const json = await res.json();
        const notebooks = (json.data || []).map((n: any) => ({
          ...n,
          priceFormatted: n.price ? formatPrice(n.price) : '-',
        }));
        setData(notebooks);
      } catch (err) {
        console.error('Failed to fetch:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (site) params.set('site', site);
      if (cpu) params.set('cpu', cpu);
      if (gpu) params.set('gpu', gpu);
      if (ram) params.set('ram', ram);
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, site, cpu, gpu, ram, pathname, router]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (search && !item.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (site && item.site !== site) return false;
      if (cpu && !item.cpu?.toLowerCase().includes(cpu.toLowerCase())) return false;
      if (gpu && !item.gpu?.toLowerCase().includes(gpu.toLowerCase())) return false;
      if (ram && item.ram !== ram) return false;
      return true;
    });
  }, [data, search, site, cpu, gpu, ram]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel de Preços - Notebooks</h1>
          <p className="text-zinc-400">Compare preços das principais lojas do Brasil</p>
        </header>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar notebook..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={site}
              onChange={e => setSite(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todas as lojas</option>
              {SITES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={cpu}
              onChange={e => setCpu(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todas as CPUs</option>
              {CPUS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={gpu}
              onChange={e => setGpu(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Todas as GPUs</option>
              {GPUS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select
              value={ram}
              onChange={e => setRam(e.target.value)}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Toda RAM</option>
              {RAMS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center p-12 text-zinc-500">
              Nenhum notebook encontrado
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-950 border-b border-zinc-800">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-zinc-800/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 text-zinc-500 text-sm">
          {filteredData.length} resultado{filteredData.length !== 1 ? 's' : ''}
        </div>
      </div>
    </main>
);
}

function Loading() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel de Preços - Notebooks</h1>
        </header>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <NotebookTableContent />
    </Suspense>
  );
}