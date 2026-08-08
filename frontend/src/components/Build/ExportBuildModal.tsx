import React, { useState } from 'react';
import { X, Copy, Download, Printer, Check, ExternalLink, FileText } from 'lucide-react';
import { SelectedBuild } from '@/types/hardware';

interface ExportBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  build: SelectedBuild;
  totalCostCash: number;
  totalCostInstallment: number;
}

export const ExportBuildModal: React.FC<ExportBuildModalProps> = ({
  isOpen,
  onClose,
  build,
  totalCostCash,
  totalCostInstallment,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getBuildText = () => {
    const lines: string[] = [
      '==========================================',
      '💻 CONFIGURAÇÃO PC BUILDER PRO',
      '==========================================',
      '',
    ];

    if (build.cpu) {
      lines.push(`• PROCESSADOR: ${build.cpu.name}`);
      lines.push(`  Loja: ${build.cpu.source} | Preço: ${formatPrice(build.cpu.priceCash)}`);
      lines.push(`  Link: ${build.cpu.link}`);
      lines.push('');
    }

    if (build.motherboard) {
      lines.push(`• PLACA-MÃE: ${build.motherboard.name}`);
      lines.push(`  Loja: ${build.motherboard.source} | Preço: ${formatPrice(build.motherboard.priceCash)}`);
      lines.push(`  Link: ${build.motherboard.link}`);
      lines.push('');
    }

    if (build.gpu) {
      lines.push(`• PLACA DE VÍDEO: ${build.gpu.name}`);
      lines.push(`  Loja: ${build.gpu.source} | Preço: ${formatPrice(build.gpu.priceCash)}`);
      lines.push(`  Link: ${build.gpu.link}`);
      lines.push('');
    } else if (build.cpu) {
      lines.push(`• PLACA DE VÍDEO: Usando Vídeo Integrado (iGPU) da CPU`);
      lines.push('');
    }

    if (build.ram) {
      const qty = build.ramQuantity || 1;
      const totalRam = build.ram.priceCash * qty;
      lines.push(`• MEMÓRIA RAM: ${qty}x ${build.ram.name}`);
      lines.push(`  Loja: ${build.ram.source} | Unitário: ${formatPrice(build.ram.priceCash)} | Total RAM: ${formatPrice(totalRam)}`);
      lines.push(`  Link: ${build.ram.link}`);
      lines.push('');
    }

    if (build.psu) {
      lines.push(`• FONTE: ${build.psu.name}`);
      lines.push(`  Loja: ${build.psu.source} | Preço: ${formatPrice(build.psu.priceCash)}`);
      lines.push(`  Link: ${build.psu.link}`);
      lines.push('');
    }

    if (build.storage) {
      lines.push(`• ARMAZENAMENTO: ${build.storage.name}`);
      lines.push(`  Loja: ${build.storage.source} | Preço: ${formatPrice(build.storage.priceCash)}`);
      lines.push(`  Link: ${build.storage.link}`);
      lines.push('');
    }

    lines.push('------------------------------------------');
    lines.push(`💰 TOTAL À VISTA (PIX): ${formatPrice(totalCostCash)}`);
    lines.push(`💳 TOTAL PARCELADO (10x): ${formatPrice(totalCostInstallment)}`);
    lines.push('==========================================');

    return lines.join('\n');
  };

  const handleCopy = () => {
    const text = getBuildText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = getBuildText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minha-build-pc-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const items = [
    { label: 'Processador (CPU)', item: build.cpu, qty: 1 },
    { label: 'Placa-MÃe', item: build.motherboard, qty: 1 },
    { label: 'Placa de Vídeo (GPU)', item: build.gpu, qty: 1 },
    { label: 'Memória RAM', item: build.ram, qty: build.ramQuantity || 1 },
    { label: 'Fonte de Alimentação', item: build.psu, qty: 1 },
    { label: 'Armazenamento (SSD/HD)', item: build.storage, qty: 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
            <FileText className="text-indigo-400" size={18} />
            <span>Exportar Orçamento da Build</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Printable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="text-center border-b border-zinc-800/80 pb-4">
            <h2 className="text-lg font-black tracking-tight text-zinc-100 uppercase">
              PC Builder Pro — Resumo da Configuração
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Lista detalhada dos componentes e orçamento final
            </p>
          </div>

          <div className="space-y-3">
            {items.map(({ label, item, qty }, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-0.5">
                    {label} {qty > 1 && `(${qty}x unidades)`}
                  </div>
                  {item ? (
                    <div>
                      <div className="text-xs font-medium text-zinc-200 truncate">{item.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                          {item.source}
                        </span>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5 print:hidden"
                        >
                          Ver produto <ExternalLink size={8} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-600 italic">Não selecionado</div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {item ? (
                    <div>
                      <div className="text-xs font-bold text-emerald-400">
                        {formatPrice(item.priceCash * qty)}
                      </div>
                      {qty > 1 && (
                        <div className="text-[9px] text-zinc-500">
                          ({formatPrice(item.priceCash)} un.)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-600">-</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400">Total à Vista (PIX):</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                {formatPrice(totalCostCash)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">Total Parcelado (10x):</div>
              <div className="text-sm font-semibold text-zinc-300 font-mono">
                {formatPrice(totalCostInstallment)}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-all"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
            >
              <Download size={14} />
              <span>Baixar TXT</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-medium transition-all"
          >
            <Printer size={14} />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
