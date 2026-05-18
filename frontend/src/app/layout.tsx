import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Painel de Preços - Notebooks',
  description: 'Compare preços de notebooks das principais lojas do Brasil',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950">
        {children}
      </body>
    </html>
  );
}