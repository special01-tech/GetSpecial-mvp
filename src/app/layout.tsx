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
  title: 'GetSpecial — Marketing IA pour Restaurants',
  description:
    'La plateforme intelligente qui transforme chaque événement, météo et moment en opportunités de chiffre d\'affaires pour votre restaurant.',
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
  themeColor: '#1B4332',
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
