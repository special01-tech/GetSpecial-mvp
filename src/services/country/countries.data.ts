export interface CountryItem {
  code: string; // ISO 3166-1 alpha-2 (ex: 'CI', 'FR', 'SN', 'US', etc.)
  nameFr: string;
  nameEn: string;
  flag: string;
  phonePrefix?: string;
}

export const WORLD_COUNTRIES: CountryItem[] = [
  // Afrique
  { code: 'CI', nameFr: "Côte d'Ivoire", nameEn: 'Ivory Coast', flag: '🇨🇮', phonePrefix: '+225' },
  { code: 'SN', nameFr: 'Sénégal', nameEn: 'Senegal', flag: '🇸🇳', phonePrefix: '+221' },
  { code: 'CM', nameFr: 'Cameroun', nameEn: 'Cameroon', flag: '🇨🇲', phonePrefix: '+237' },
  { code: 'MA', nameFr: 'Maroc', nameEn: 'Morocco', flag: '🇲🇦', phonePrefix: '+212' },
  { code: 'TN', nameFr: 'Tunisie', nameEn: 'Tunisia', flag: '🇹🇳', phonePrefix: '+216' },
  { code: 'DZ', nameFr: 'Algérie', nameEn: 'Algeria', flag: '🇩🇿', phonePrefix: '+213' },
  { code: 'BJ', nameFr: 'Bénin', nameEn: 'Benin', flag: '🇧🇯', phonePrefix: '+229' },
  { code: 'TG', nameFr: 'Togo', nameEn: 'Togo', flag: '🇹🇬', phonePrefix: '+228' },
  { code: 'ML', nameFr: 'Mali', nameEn: 'Mali', flag: '🇲🇱', phonePrefix: '+223' },
  { code: 'BF', nameFr: 'Burkina Faso', nameEn: 'Burkina Faso', flag: '🇧🇫', phonePrefix: '+226' },
  { code: 'GN', nameFr: 'Guinée', nameEn: 'Guinea', flag: '🇬🇳', phonePrefix: '+224' },
  { code: 'CD', nameFr: 'RD Congo', nameEn: 'DR Congo', flag: '🇨🇩', phonePrefix: '+243' },
  { code: 'CG', nameFr: 'Congo', nameEn: 'Congo', flag: '🇨🇬', phonePrefix: '+242' },
  { code: 'GA', nameFr: 'Gabon', nameEn: 'Gabon', flag: '🇬🇦', phonePrefix: '+241' },
  { code: 'MG', nameFr: 'Madagascar', nameEn: 'Madagascar', flag: '🇲🇬', phonePrefix: '+261' },
  { code: 'MU', nameFr: 'Maurice', nameEn: 'Mauritius', flag: '🇲🇺', phonePrefix: '+230' },
  { code: 'RW', nameFr: 'Rwanda', nameEn: 'Rwanda', flag: '🇷🇼', phonePrefix: '+250' },
  { code: 'KE', nameFr: 'Kenya', nameEn: 'Kenya', flag: '🇰🇪', phonePrefix: '+254' },
  { code: 'NG', nameFr: 'Nigéria', nameEn: 'Nigeria', flag: '🇳🇬', phonePrefix: '+234' },
  { code: 'GH', nameFr: 'Ghana', nameEn: 'Ghana', flag: '🇬🇭', phonePrefix: '+233' },
  { code: 'ZA', nameFr: 'Afrique du Sud', nameEn: 'South Africa', flag: '🇿🇦', phonePrefix: '+27' },
  { code: 'EG', nameFr: 'Égypte', nameEn: 'Egypt', flag: '🇪🇬', phonePrefix: '+20' },

  // Europe
  { code: 'FR', nameFr: 'France', nameEn: 'France', flag: '🇫🇷', phonePrefix: '+33' },
  { code: 'BE', nameFr: 'Belgique', nameEn: 'Belgium', flag: '🇧🇪', phonePrefix: '+32' },
  { code: 'CH', nameFr: 'Suisse', nameEn: 'Switzerland', flag: '🇨🇭', phonePrefix: '+41' },
  { code: 'LU', nameFr: 'Luxembourg', nameEn: 'Luxembourg', flag: '🇱🇺', phonePrefix: '+352' },
  { code: 'MC', nameFr: 'Monaco', nameEn: 'Monaco', flag: '🇲🇨', phonePrefix: '+377' },
  { code: 'GB', nameFr: 'Royaume-Uni', nameEn: 'United Kingdom', flag: '🇬🇧', phonePrefix: '+44' },
  { code: 'ES', nameFr: 'Espagne', nameEn: 'Spain', flag: '🇪🇸', phonePrefix: '+34' },
  { code: 'IT', nameFr: 'Italie', nameEn: 'Italy', flag: '🇮🇹', phonePrefix: '+39' },
  { code: 'DE', nameFr: 'Allemagne', nameEn: 'Germany', flag: '🇩🇪', phonePrefix: '+49' },
  { code: 'PT', nameFr: 'Portugal', nameEn: 'Portugal', flag: '🇵🇹', phonePrefix: '+351' },
  { code: 'NL', nameFr: 'Pays-Bas', nameEn: 'Netherlands', flag: '🇳🇱', phonePrefix: '+31' },
  { code: 'IE', nameFr: 'Irlande', nameEn: 'Ireland', flag: '🇮🇪', phonePrefix: '+353' },
  { code: 'AT', nameFr: 'Autriche', nameEn: 'Austria', flag: '🇦🇹', phonePrefix: '+43' },
  { code: 'SE', nameFr: 'Suède', nameEn: 'Sweden', flag: '🇸🇪', phonePrefix: '+46' },
  { code: 'NO', nameFr: 'Norvège', nameEn: 'Norway', flag: '🇳🇴', phonePrefix: '+47' },
  { code: 'DK', nameFr: 'Danemark', nameEn: 'Denmark', flag: '🇩🇰', phonePrefix: '+45' },
  { code: 'FI', nameFr: 'Finlande', nameEn: 'Finland', flag: '🇫🇮', phonePrefix: '+358' },
  { code: 'GR', nameFr: 'Grèce', nameEn: 'Greece', flag: '🇬🇷', phonePrefix: '+30' },
  { code: 'PL', nameFr: 'Pologne', nameEn: 'Poland', flag: '🇵🇱', phonePrefix: '+48' },
  { code: 'RO', nameFr: 'Roumanie', nameEn: 'Romania', flag: '🇷🇴', phonePrefix: '+40' },
  { code: 'CZ', nameFr: 'Tchéquie', nameEn: 'Czech Republic', flag: '🇨🇿', phonePrefix: '+420' },
  { code: 'TR', nameFr: 'Turquie', nameEn: 'Turkey', flag: '🇹🇷', phonePrefix: '+90' },

  // Amériques
  { code: 'CA', nameFr: 'Canada', nameEn: 'Canada', flag: '🇨🇦', phonePrefix: '+1' },
  { code: 'US', nameFr: 'États-Unis', nameEn: 'United States', flag: '🇺🇸', phonePrefix: '+1' },
  { code: 'MX', nameFr: 'Mexique', nameEn: 'Mexico', flag: '🇲🇽', phonePrefix: '+52' },
  { code: 'BR', nameFr: 'Brésil', nameEn: 'Brazil', flag: '🇧🇷', phonePrefix: '+55' },
  { code: 'AR', nameFr: 'Argentine', nameEn: 'Argentina', flag: '🇦🇷', phonePrefix: '+54' },
  { code: 'CO', nameFr: 'Colombie', nameEn: 'Colombia', flag: '🇨🇴', phonePrefix: '+57' },
  { code: 'CL', nameFr: 'Chili', nameEn: 'Chile', flag: '🇨🇱', phonePrefix: '+56' },
  { code: 'PE', nameFr: 'Pérou', nameEn: 'Peru', flag: '🇵🇪', phonePrefix: '+51' },
  { code: 'HT', nameFr: 'Haïti', nameEn: 'Haiti', flag: '🇭🇹', phonePrefix: '+509' },
  { code: 'GP', nameFr: 'Guadeloupe', nameEn: 'Guadeloupe', flag: '🇬🇵', phonePrefix: '+590' },
  { code: 'MQ', nameFr: 'Martinique', nameEn: 'Martinique', flag: '🇲🇶', phonePrefix: '+596' },
  { code: 'RE', nameFr: 'La Réunion', nameEn: 'Reunion', flag: '🇷🇪', phonePrefix: '+262' },
  { code: 'GF', nameFr: 'Guyane française', nameEn: 'French Guiana', flag: '🇬🇫', phonePrefix: '+594' },

  // Moyen-Orient & Asie
  { code: 'AE', nameFr: 'Émirats Arabes Unis', nameEn: 'United Arab Emirates', flag: '🇦🇪', phonePrefix: '+971' },
  { code: 'SA', nameFr: 'Arabie Saoudite', nameEn: 'Saudi Arabia', flag: '🇸🇦', phonePrefix: '+966' },
  { code: 'QA', nameFr: 'Qatar', nameEn: 'Qatar', flag: '🇶🇦', phonePrefix: '+974' },
  { code: 'LB', nameFr: 'Liban', nameEn: 'Lebanon', flag: '🇱🇧', phonePrefix: '+961' },
  { code: 'IL', nameFr: 'Israël', nameEn: 'Israel', flag: '🇮🇱', phonePrefix: '+972' },
  { code: 'JP', nameFr: 'Japon', nameEn: 'Japan', flag: '🇯🇵', phonePrefix: '+81' },
  { code: 'CN', nameFr: 'Chine', nameEn: 'China', flag: '🇨🇳', phonePrefix: '+86' },
  { code: 'KR', nameFr: 'Corée du Sud', nameEn: 'South Korea', flag: '🇰🇷', phonePrefix: '+82' },
  { code: 'IN', nameFr: 'Inde', nameEn: 'India', flag: '🇮🇳', phonePrefix: '+91' },
  { code: 'VN', nameFr: 'Vietnam', nameEn: 'Vietnam', flag: '🇻🇳', phonePrefix: '+84' },
  { code: 'TH', nameFr: 'Thaïlande', nameEn: 'Thailand', flag: '🇹🇭', phonePrefix: '+66' },
  { code: 'SG', nameFr: 'Singapour', nameEn: 'Singapore', flag: '🇸🇬', phonePrefix: '+65' },
  { code: 'ID', nameFr: 'Indonésie', nameEn: 'Indonesia', flag: '🇮🇩', phonePrefix: '+62' },
  { code: 'MY', nameFr: 'Malaisie', nameEn: 'Malaysia', flag: '🇲🇾', phonePrefix: '+60' },

  // Océanie
  { code: 'AU', nameFr: 'Australie', nameEn: 'Australia', flag: '🇦🇺', phonePrefix: '+61' },
  { code: 'NZ', nameFr: 'Nouvelle-Zélande', nameEn: 'New Zealand', flag: '🇳🇿', phonePrefix: '+64' },
  { code: 'NC', nameFr: 'Nouvelle-Calédonie', nameEn: 'New Caledonia', flag: '🇳🇨', phonePrefix: '+687' },
  { code: 'PF', nameFr: 'Polynésie française', nameEn: 'French Polynesia', flag: '🇵🇫', phonePrefix: '+689' },
];

/**
 * Normalise une chaîne pour la recherche sans accent
 */
function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Recherche ou trouve le pays le plus correspondant
 */
export function findCountry(query?: string): CountryItem | null {
  if (!query || typeof query !== 'string') return null;
  const clean = stripAccents(query);
  const upper = query.trim().toUpperCase();

  // 1. Recherche par code ISO exact (2 lettres)
  const byCode = WORLD_COUNTRIES.find((c) => c.code === upper);
  if (byCode) return byCode;

  // 2. Recherche par nom FR ou EN exact
  const byExactName = WORLD_COUNTRIES.find(
    (c) => stripAccents(c.nameFr) === clean || stripAccents(c.nameEn) === clean
  );
  if (byExactName) return byExactName;

  // 3. Recherche partielle
  const byPartial = WORLD_COUNTRIES.find(
    (c) => stripAccents(c.nameFr).includes(clean) || stripAccents(c.nameEn).includes(clean)
  );
  if (byPartial) return byPartial;

  return null;
}

/**
 * Récupère le drapeau d'un pays par son code ISO ou nom
 */
export function getCountryFlag(countryInput?: string): string {
  const found = findCountry(countryInput);
  return found?.flag || '';
}

/**
 * Récupère le nom affichable du pays en français
 */
export function getCountryDisplayName(countryInput?: string): string {
  if (!countryInput) return '';
  const found = findCountry(countryInput);
  return found ? found.nameFr : countryInput;
}
