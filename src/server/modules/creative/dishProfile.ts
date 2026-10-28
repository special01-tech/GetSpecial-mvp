import { getSupabaseAdmin } from '@/server/supabase';
import { rodiumChat } from '@/server/lib/rodium';

export interface DishProfile {
  dishName: string;
  presentation: string;
  accompaniments: string[];
  sensoryVocabulary: string[];
  photoAngles: string[];
  aiAvoidErrors: string[];
}

export async function getDishProfile(dishName: string, region?: string): Promise<DishProfile | null> {
  if (!dishName || dishName.trim().length < 2) return null;

  const normalizedName = dishName.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  try {
    const { data } = await supabase
      .from('dish_profiles')
      .select('*')
      .eq('normalized_name', normalizedName)
      .maybeSingle();

    if (data) {
      return {
        dishName: data.dish_name,
        presentation: data.presentation,
        accompaniments: data.accompaniments || [],
        sensoryVocabulary: data.sensory_vocabulary || [],
        photoAngles: data.photo_angles || [],
        aiAvoidErrors: data.ai_avoid_errors || [],
      };
    }

    // Generate dish profile via LLM if missing
    const prompt = `Tu es un expert culinaire international. Crée une fiche technique d'analyse visuelle et gustative pour le plat : "${dishName}".
${region ? `Région/Origine : ${region}` : ''}
Réponds uniquement en JSON strict :
{
  "presentation": "description précise du dressage traditionnel et visuel du plat",
  "accompaniments": ["liste d'accompagnements typiques"],
  "sensoryVocabulary": ["3-5 adjectifs sensoriels pertinents"],
  "photoAngles": ["meilleurs angles de prise de vue"],
  "aiAvoidErrors": ["2-3 erreurs fréquentes d'IA quand elle génère ce plat (ex: textures irréalistes, mauvais accompagnements)"]
}`;

    const res = await rodiumChat([{ role: 'user', content: prompt }], { maxTokens: 1500, temperature: 0.2 });

    const newProfile: DishProfile = {
      dishName,
      presentation: res?.presentation || `Plat traditionnel ${dishName} bien présenté.`,
      accompaniments: Array.isArray(res?.accompaniments) ? res.accompaniments : [],
      sensoryVocabulary: Array.isArray(res?.sensoryVocabulary) ? res.sensoryVocabulary : ['savoureux', 'gourmand'],
      photoAngles: Array.isArray(res?.photoAngles) ? res.photoAngles : ['45 degrés', 'vue du dessus'],
      aiAvoidErrors: Array.isArray(res?.aiAvoidErrors) ? res.aiAvoidErrors : ['aspect plastique brillant'],
    };

    // Save into dish_profiles cache table silently
    await supabase.from('dish_profiles').insert({
      dish_name: dishName,
      normalized_name: normalizedName,
      region: region || 'global',
      presentation: newProfile.presentation,
      accompaniments: newProfile.accompaniments,
      sensory_vocabulary: newProfile.sensoryVocabulary,
      photo_angles: newProfile.photoAngles,
      ai_avoid_errors: newProfile.aiAvoidErrors,
      status: 'cached',
    });

    return newProfile;
  } catch (err) {
    console.warn('[DishProfile] Failed to fetch or cache dish profile:', err);
    return null;
  }
}
