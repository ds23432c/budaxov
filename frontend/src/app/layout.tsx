import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import ParticleCanvas from '@/components/ParticleCanvas';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Budaxov — Terraria Портал',
  description: 'Лучший русскоязычный портал по игре Terraria. Вики, форум, лидерборд, гайды.',
  keywords: 'terraria, terraria вики, terraria гайды, terraria форум, budaxov',
  openGraph: {
    title: 'Budaxov — Terraria Портал',
    description: 'Лучший русскоязычный портал по Terraria',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#060d1a] text-white antialiased">
        <AuthProvider>
          <ParticleCanvas />
          <Navbar />
          <main className="relative z-10">{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#0f2744', color: '#fff', border: '1px solid rgba(255,215,0,0.2)' },
              success: { iconTheme: { primary: '#FFD700', secondary: '#000' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
