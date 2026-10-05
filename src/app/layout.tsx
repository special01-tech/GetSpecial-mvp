import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { LanguageProvider, LOCALE_COOKIE, isLocale } from '@/i18n';

/* =============================================================================
 * Root Layout
 *
 * Layout racine de l'app. Définit :
 * - Les métadonnées SEO et PWA
 * - La police Poppins via Google Fonts
 * - Le wrapper HTML global
 * ============================================================================= */

export const metadata: Metadata = {
  title: 'GetSpecial — AI Marketing for Restaurants',
  description:
    "The smart platform turning every event, weather shift and moment into revenue opportunities for your restaurant. / La plateforme intelligente qui transforme chaque événement, météo et moment en opportunités de chiffre d'affaires pour votre restaurant.",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale = isLocale(saved) ? saved : 'fr';

  return (
    <html lang={initialLocale}>
      <body>
        <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
