/* =============================================================================
 * Mock Posters Data URIs — Images locales garanties 100% hors-ligne & instantanées
 * ============================================================================= */

const createSvgPoster = (
  bgStart: string,
  bgEnd: string,
  badgeText: string,
  badgeColor: string,
  title: string,
  subtitle: string,
  accentColor: string,
  dishEmojiOrIcon: string
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <radialGradient id="bg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="60%" stop-color="${bgEnd}" />
        <stop offset="100%" stop-color="#05070B" />
      </radialGradient>
      <linearGradient id="badgeG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${badgeColor}" />
        <stop offset="100%" stop-color="${accentColor}" />
      </linearGradient>
      <filter id="fShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.75" />
      </filter>
    </defs>

    <!-- Fond ambiance restaurant -->
    <rect width="800" height="600" fill="url(#bg)" />

    <!-- Halos lumineux d'ambiance -->
    <circle cx="400" cy="280" r="220" fill="${accentColor}" opacity="0.18" />
    <circle cx="200" cy="180" r="140" fill="${badgeColor}" opacity="0.12" />

    <!-- Illustration culinaire centrale -->
    <g transform="translate(400, 270)" filter="url(#fShadow)">
      <!-- Assiette de présentation moderne -->
      <ellipse cx="0" cy="70" rx="240" ry="80" fill="#0F172A" stroke="#334155" stroke-width="3" />
      <ellipse cx="0" cy="70" rx="210" ry="68" fill="#1E293B" />
      
      <!-- Symbole culinaire géant stylisé -->
      <text x="0" y="55" font-size="110" text-anchor="middle" dominant-baseline="middle">${dishEmojiOrIcon}</text>
    </g>

    <!-- Tag Promotionnel moderne en haut à gauche -->
    <g transform="translate(40, 40)" filter="url(#fShadow)">
      <rect x="0" y="0" width="220" height="46" rx="23" fill="url(#badgeG)" />
      <text x="110" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${badgeText}</text>
    </g>

    <!-- Badge horaire en haut à droite -->
    <g transform="translate(570, 40)" filter="url(#fShadow)">
      <rect x="0" y="0" width="190" height="42" rx="12" fill="#0F172ACC" stroke="#334155" stroke-width="1.5" />
      <text x="95" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#E2E8F0" text-anchor="middle">⏱ OFFRE LIMITÉE</text>
    </g>

    <!-- Bandeau Typographique bas -->
    <g transform="translate(400, 520)" filter="url(#fShadow)">
      <rect x="-360" y="-42" width="720" height="88" rx="16" fill="#0B0F17EE" stroke="#1E293B" stroke-width="1.5" />
      <text x="0" y="-8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="-0.5">${title}</text>
      <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#94A3B8" text-anchor="middle">${subtitle}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const MOCK_POSTER_IMAGES = [
  createSvgPoster(
    '#3B1808',
    '#1A0C04',
    '★ -50% CE SOIR ★',
    '#FF5A00',
    'HAPPY HOUR WINGS CRAZY',
    'Ailes de poulet croustillantes & sauce secrète du chef',
    '#FFA000',
    '🍗'
  ),
  createSvgPoster(
    '#1E293B',
    '#0F172A',
    '★ BURGER DU CHEF ★',
    '#EA580C',
    'SMASH BURGER SUPRÊME',
    'Double cheddar fondu, bacon croustillant & frites fraîches',
    '#F59E0B',
    '🍔'
  ),
  createSvgPoster(
    '#3B0764',
    '#1E1B4B',
    '★ AFTERWORK FESTIF ★',
    '#EC4899',
    'SPRITZ & COCKTAILS SUNSET',
    'Ambiance lounge & musique live dès 18h',
    '#8B5CF6',
    '🍹'
  ),
  createSvgPoster(
    '#2E1005',
    '#180802',
    '★ FOUR À BOIS ★',
    '#E11D48',
    'PIZZA MARGHERITA D.O.P',
    'Mozzarella fior di latte, basilic frais & pâte alvéolée',
    '#FB7185',
    '🍕'
  ),
];
