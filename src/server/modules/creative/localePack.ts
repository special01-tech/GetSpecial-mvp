import { getSupabaseAdmin } from '@/server/supabase';

export interface LocalePack {
  code: string;
  currency: string;
  priceFormat: string; // e.g. "{amount} €", "{amount} F", "${amount}"
  languages: string[];
  channels: string[];
  lexicon: Record<string, string>;
  visualStyleNuances: string[];
}

const DEFAULT_LOCALE_PACK: LocalePack = {
  code: 'generic',
  currency: 'EUR',
  priceFormat: '{amount} €',
  languages: ['fr'],
  channels: ['instagram', 'facebook', 'tiktok'],
  lexicon: {
    order: 'Commander',
    taste: 'Délicieux',
    offer: 'Offre spéciale',
  },
  visualStyleNuances: ['Éclairage naturel', 'Couleurs vibrantes et gourmandes'],
};

export async function getLocalePack(localeCode?: string | null): Promise<LocalePack> {
  if (!localeCode) return DEFAULT_LOCALE_PACK;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('locale_packs')
      .select('*')
      .eq('code', localeCode)
      .single();

    if (error || !data) return DEFAULT_LOCALE_PACK;

    return {
      code: data.code,
      currency: data.currency || DEFAULT_LOCALE_PACK.currency,
      priceFormat: data.price_format || DEFAULT_LOCALE_PACK.priceFormat,
      languages: data.languages || DEFAULT_LOCALE_PACK.languages,
      channels: data.channels || DEFAULT_LOCALE_PACK.channels,
      lexicon: data.lexicon || DEFAULT_LOCALE_PACK.lexicon,
      visualStyleNuances: data.visual_style_nuances || DEFAULT_LOCALE_PACK.visualStyleNuances,
    };
  } catch (err) {
    console.warn('[LocalePack] Error fetching locale pack, using default:', err);
    return DEFAULT_LOCALE_PACK;
  }
}

export function formatPrice(priceStr: string | number | null | undefined, pack: LocalePack): string | null {
  if (!priceStr) return null;
  const num = typeof priceStr === 'number' ? priceStr : parseFloat(String(priceStr).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(priceStr);
  const formattedNum = num.toLocaleString('fr-FR');
  return pack.priceFormat.replace('{amount}', formattedNum);
}
