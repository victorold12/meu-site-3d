import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Victor Hugo — Portfólio 3D',
  description: 'Portfólio 3D de Victor Hugo com projetos pessoais e experimentos.',
  robots: { index: false, follow: false, nocache: true },
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/world/favicons/favicon.ico`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/world/favicons/apple-touch-icon.png`,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
