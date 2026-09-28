import type { Metadata, Viewport } from 'next';
import './globals.css';

/* =============================================================================
 * Root Layout
 *
 * Layout racine de l'app. Définit :
 * - Les métadonnées SEO et PWA
 * - La police Poppins via Google Fonts
 * - Le wrapper HTML global
 * ============================================================================= */

export const metadata: Metadata = {
  title: 'GetSpecial — Marketing intelligent pour restaurants',
  description:
    'La plateforme centralisée pour les restaurants et leur marketing. Transformez le quotidien en opportunités.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GetSpecial',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FF5A00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
