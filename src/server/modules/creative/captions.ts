import { z } from 'zod';
import { rodiumChat } from '@/server/lib/rodium';
import { ConceptOutput } from './concept';
import { LocalePack, formatPrice } from './localePack';
import { CaptionChannelSchema } from './types';

export type CaptionChannel = z.infer<typeof CaptionChannelSchema>;

export async function runCaptionsStep(
  concept: ConceptOutput,
  offerName: string,
  localePack: LocalePack,
  options: {
    outputLanguage?: string | null;
    restaurantName?: string | null;
    phone?: string | null;
    /** Debuts de legendes deja publies par ce restaurant : a ne pas reprendre. */
    recentOpenings?: string[];
    /** Style d'accroche de cette creation : les legendes gardent le meme registre. */
    headlineStyle?: { id: string; brief: string } | null;
  } = {}
): Promise<CaptionChannel[]> {
  // Prix tel que fourni par l'utilisateur ; reformate seulement avec un pack local precis.
  const priceDisplay = concept.price ? (localePack.code === 'generic' ? concept.price : formatPrice(concept.price, localePack)) : '';

  const prompt = `Tu es un Community Manager culinaire d'élite.
Rédige les légendes pour une campagne publicitaire restaurant.

Offre : "${offerName}"
Headline : "${concept.headline}"
Prix : "${priceDisplay}"
Angle stratégique : "${concept.angle}"
Ton : "${concept.voice_tone}"
${options.headlineStyle ? `Registre : ${options.headlineStyle.id} - ${options.headlineStyle.brief}` : ''}
${options.restaurantName ? `Restaurant : "${options.restaurantName}"` : ''}
${options.phone ? `Contact (WhatsApp / téléphone) : "${options.phone}"` : ''}
LANGUE : ${options.outputLanguage ? `toutes les légendes sont rédigées en "${options.outputLanguage}"` : "la langue de l'offre"}, sans mélange.
RÈGLES : n'invente jamais un prix, une promotion ou un cadeau. Aucune mention d'IA. N'écris JAMAIS de nom de ville, de pays ou de nationalité (légendes et hashtags), sauf s'ils figurent dans l'offre. Facebook : plus complet, avec l'offre et un appel à l'action clair. Instagram : court, rythmé, première phrase accrocheuse. TikTok : très court, direct.
${options.recentOpenings && options.recentOpenings.length ? `DÉBUTS DE LÉGENDES DÉJÀ UTILISÉS (ne les reprends pas, change la structure et le vocabulaire) : ${JSON.stringify(options.recentOpenings)}` : ''}

Génère 3 variantes de ton ("complice", "gourmand", "urgent") pour chacun des 3 canaux ("instagram", "facebook", "tiktok").
Chaque variante a 3 à 5 hashtags au maximum, centrés sur le plat, la gourmandise et la marque.

Formate ta réponse exclusivement en JSON strict :
{
  "instagram": [
    { "tone": "complice", "text": "...", "hashtags": ["#...", "#..."] },
    { "tone": "gourmand", "text": "...", "hashtags": ["#...", "#..."] },
    { "tone": "urgent", "text": "...", "hashtags": ["#...", "#..."] }
  ],
  "facebook": [
    { "tone": "complice", "text": "...", "hashtags": ["#...", "#..."] },
    { "tone": "gourmand", "text": "...", "hashtags": ["#...", "#..."] },
    { "tone": "urgent", "text": "...", "hashtags": ["#...", "#..."] }
  ],
  "tiktok": [
    { "tone": "complice", "text": "...", "hashtags": ["#...", "#..."] },
    { "tone": "gourmand", "text": "...", "hashtags": ["#...", "#..."] },
    { "tone": "urgent", "text": "...", "hashtags": ["#...", "#..."] }
  ]
}`;

  const res = await rodiumChat(
    [{ role: 'user', content: prompt }],
    { maxTokens: 3500, temperature: 0.7 }
  );

  const fallbackHashtags = ['#Foodies', '#GetSpecial', '#Gourmet', '#RestaurantLife'];

  const parseChannelVariants = (channelData: unknown) => {
    if (!Array.isArray(channelData)) {
      return [
        {
          tone: 'complice',
          text: `Découvrez notre ${offerName} ! ${priceDisplay ? `Prix : ${priceDisplay}` : ''}`,
          hashtags: fallbackHashtags,
        },
      ];
    }
    return channelData.map((v: Record<string, unknown>) => ({
      tone: String(v?.tone || 'complice'),
      text: String(v?.text || offerName),
      hashtags: Array.isArray(v?.hashtags) ? v.hashtags.map(String) : fallbackHashtags,
    }));
  };

  const captions: CaptionChannel[] = [
    { channel: 'instagram', variants: parseChannelVariants(res?.instagram) },
    { channel: 'facebook', variants: parseChannelVariants(res?.facebook) },
    { channel: 'tiktok', variants: parseChannelVariants(res?.tiktok) },
  ];

  return captions;
}
