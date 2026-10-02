/**
 * Country & Cultural Localization Engine
 * Provides international config (currency, units, language, date/time formats, distance)
 * for worldwide restaurants across all platforms and signal collectors.
 */

export interface CountryConfig {
  code: string; // 2-letter uppercase ISO 3166-1 alpha-2 (e.g., 'US', 'GB', 'FR', 'DE', 'ES', 'CA', 'AU', 'JP')
  name: string;
  language: string; // Primary language code (e.g., 'en', 'fr', 'de', 'es', 'it', 'ja')
  locale: string; // BCP 47 locale (e.g., 'en-US', 'en-GB', 'fr-FR', 'de-DE')
  currencySymbol: string; // '$', '£', '€', 'C$', 'A$', '¥', 'MX$', 'R$'
  currencyCode: string; // 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'MXN', 'BRL'
  units: 'imperial' | 'metric';
  tempUnit: '°F' | '°C';
  distanceUnit: 'miles' | 'km';
  speedUnit: 'mph' | 'km/h' | 'm/s';
  timeFormat: '12h' | '24h';
  phonePrefix: string;
}

const COUNTRY_REGISTRY: Record<string, CountryConfig> = {
  // United States
  US: {
    code: 'US',
    name: 'United States',
    language: 'en',
    locale: 'en-US',
    currencySymbol: '$',
    currencyCode: 'USD',
    units: 'imperial',
    tempUnit: '°F',
    distanceUnit: 'miles',
    speedUnit: 'mph',
    timeFormat: '12h',
    phonePrefix: '+1',
  },
  // United Kingdom
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    language: 'en',
    locale: 'en-GB',
    currencySymbol: '£',
    currencyCode: 'GBP',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'miles',
    speedUnit: 'mph',
    timeFormat: '12h',
    phonePrefix: '+44',
  },
  // Canada
  CA: {
    code: 'CA',
    name: 'Canada',
    language: 'en',
    locale: 'en-CA',
    currencySymbol: 'C$',
    currencyCode: 'CAD',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '12h',
    phonePrefix: '+1',
  },
  // Australia
  AU: {
    code: 'AU',
    name: 'Australia',
    language: 'en',
    locale: 'en-AU',
    currencySymbol: 'A$',
    currencyCode: 'AUD',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '12h',
    phonePrefix: '+61',
  },
  // France
  FR: {
    code: 'FR',
    name: 'France',
    language: 'fr',
    locale: 'fr-FR',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'm/s',
    timeFormat: '24h',
    phonePrefix: '+33',
  },
  // Germany
  DE: {
    code: 'DE',
    name: 'Germany',
    language: 'de',
    locale: 'de-DE',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+49',
  },
  // Spain
  ES: {
    code: 'ES',
    name: 'Spain',
    language: 'es',
    locale: 'es-ES',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+34',
  },
  // Italy
  IT: {
    code: 'IT',
    name: 'Italy',
    language: 'it',
    locale: 'it-IT',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+39',
  },
  // Belgium
  BE: {
    code: 'BE',
    name: 'Belgium',
    language: 'fr',
    locale: 'fr-BE',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+32',
  },
  // Switzerland
  CH: {
    code: 'CH',
    name: 'Switzerland',
    language: 'de',
    locale: 'de-CH',
    currencySymbol: 'CHF',
    currencyCode: 'CHF',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+41',
  },
  // Netherlands
  NL: {
    code: 'NL',
    name: 'Netherlands',
    language: 'nl',
    locale: 'nl-NL',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+31',
  },
  // Mexico
  MX: {
    code: 'MX',
    name: 'Mexico',
    language: 'es',
    locale: 'es-MX',
    currencySymbol: 'MX$',
    currencyCode: 'MXN',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '12h',
    phonePrefix: '+52',
  },
  // Brazil
  BR: {
    code: 'BR',
    name: 'Brazil',
    language: 'pt',
    locale: 'pt-BR',
    currencySymbol: 'R$',
    currencyCode: 'BRL',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+55',
  },
  // Japan
  JP: {
    code: 'JP',
    name: 'Japan',
    language: 'ja',
    locale: 'ja-JP',
    currencySymbol: '¥',
    currencyCode: 'JPY',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+81',
  },
  // Ireland
  IE: {
    code: 'IE',
    name: 'Ireland',
    language: 'en',
    locale: 'en-IE',
    currencySymbol: '€',
    currencyCode: 'EUR',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '12h',
    phonePrefix: '+353',
  },
  // New Zealand
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    language: 'en',
    locale: 'en-NZ',
    currencySymbol: 'NZ$',
    currencyCode: 'NZD',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '12h',
    phonePrefix: '+64',
  },
  // Côte d'Ivoire
  CI: {
    code: 'CI',
    name: "Côte d'Ivoire",
    language: 'fr',
    locale: 'fr-CI',
    currencySymbol: 'FCFA',
    currencyCode: 'XOF',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+225',
  },
  // Sénégal
  SN: {
    code: 'SN',
    name: 'Sénégal',
    language: 'fr',
    locale: 'fr-SN',
    currencySymbol: 'FCFA',
    currencyCode: 'XOF',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+221',
  },
  // Cameroun
  CM: {
    code: 'CM',
    name: 'Cameroun',
    language: 'fr',
    locale: 'fr-CM',
    currencySymbol: 'FCFA',
    currencyCode: 'XAF',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+237',
  },
  // Maroc
  MA: {
    code: 'MA',
    name: 'Maroc',
    language: 'fr',
    locale: 'fr-MA',
    currencySymbol: 'DH',
    currencyCode: 'MAD',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+212',
  },
  // Tunisie
  TN: {
    code: 'TN',
    name: 'Tunisie',
    language: 'fr',
    locale: 'fr-TN',
    currencySymbol: 'DT',
    currencyCode: 'TND',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+216',
  },
  // Algérie
  DZ: {
    code: 'DZ',
    name: 'Algérie',
    language: 'fr',
    locale: 'fr-DZ',
    currencySymbol: 'DA',
    currencyCode: 'DZD',
    units: 'metric',
    tempUnit: '°C',
    distanceUnit: 'km',
    speedUnit: 'km/h',
    timeFormat: '24h',
    phonePrefix: '+213',
  },
};

// Aliases
const COUNTRY_ALIASES: Record<string, string> = {
  COTE_D_IVOIRE: 'CI',
  IVORY_COAST: 'CI',
  SENEGAL: 'SN',
  CAMEROUN: 'CM',
  CAMEROON: 'CM',
  MAROC: 'MA',
  MOROCCO: 'MA',
  TUNISIE: 'TN',
  TUNISIA: 'TN',
  ALGERIE: 'DZ',
  ALGERIA: 'DZ',
  USA: 'US',
  UNITED_STATES: 'US',
  ETATS_UNIS: 'US',
  UK: 'GB',
  UNITED_KINGDOM: 'GB',
  ROYAUME_UNI: 'GB',
  ENGLAND: 'GB',
  FRANCE: 'FR',
  GERMANY: 'DE',
  ALLEMAGNE: 'DE',
  DEUTSCHLAND: 'DE',
  SPAIN: 'ES',
  ESPAGNE: 'ES',
  ESPAÑA: 'ES',
  ITALY: 'IT',
  ITALIE: 'IT',
  ITALIA: 'IT',
  CANADA: 'CA',
  AUSTRALIA: 'AU',
  BELGIUM: 'BE',
  BELGIQUE: 'BE',
  SWITZERLAND: 'CH',
  SUISSE: 'CH',
  MEXICO: 'MX',
  MEXIQUE: 'MX',
  BRAZIL: 'BR',
  BRESIL: 'BR',
  JAPAN: 'JP',
  JAPON: 'JP',
};

/**
 * Normalise et extrait la configuration d'un pays à partir d'un code ou d'un nom.
 * Fonctionne pour n'importe quel pays au monde avec fallback intelligent.
 */
export function getCountryConfig(countryInput?: string): CountryConfig {
  if (!countryInput || typeof countryInput !== 'string') {
    return COUNTRY_REGISTRY['US'];
  }

  const clean = countryInput.trim().toUpperCase().replace(/[\s-]/g, '_');

  // 1. Direct match on 2-letter ISO
  if (COUNTRY_REGISTRY[clean]) {
    return COUNTRY_REGISTRY[clean];
  }

  // 2. Alias match
  const aliasCode = COUNTRY_ALIASES[clean];
  if (aliasCode && COUNTRY_REGISTRY[aliasCode]) {
    return COUNTRY_REGISTRY[aliasCode];
  }

  // 3. Dynamic ISO code fallback for any international country
  const iso2 = clean.length === 2 ? clean : clean.slice(0, 2);

  return {
    code: iso2,
    name: countryInput.trim(),
    language: 'en', // International business standard
    locale: `${iso2.toLowerCase()}-${iso2}`,
    currencySymbol: '$',
    currencyCode: 'USD',
    units: iso2 === 'US' ? 'imperial' : 'metric',
    tempUnit: iso2 === 'US' ? '°F' : '°C',
    distanceUnit: iso2 === 'US' || iso2 === 'GB' ? 'miles' : 'km',
    speedUnit: iso2 === 'US' || iso2 === 'GB' ? 'mph' : 'km/h',
    timeFormat: '12h',
    phonePrefix: '+1',
  };
}
