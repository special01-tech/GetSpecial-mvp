export type AspectRatio = '4:5' | '9:16' | '1:1' | '16:9';
export type CampaignType = 'promotion' | 'new_dish' | 'drink' | 'event' | 'daily_menu' | 'custom';
export type GenerationMode = 'generate' | 'regenerate_different' | 'regenerate_same';
export type VisualStyle = 'gourmet' | 'festive' | 'chic' | 'deal';
export type TargetPlatform = 'instagram' | 'facebook' | 'google_business';

export interface FoodProfile {
  meal_category?: string;
  cuisine?: string;
  hero_product?: string;
  secondary_products?: string[];
  serving_style?: string;
  temperature?: string;
  textures?: string[];
  hero_visual?: string;
  recommended_environment?: string;
  culinary_identity?: string;
  authenticity_notes?: string[];
  [key: string]: any;
}

export interface AdvertisingConcept {
  poster_family?: string;
  main_message?: string;
  visual_hook?: string;
  main_hero?: string;
  secondary_hero?: string;
  information_priority?: string[];
  eye_path?: string;
  advertising_story?: string;
  photo_role?: string;
  graphic_role?: string;
  emotion_goal?: string;
  attention_strategy?: string;
  camera_angle?: string;
  lighting_family?: string;
  [key: string]: any;
}

export interface CreativeDNA {
  brand_personality?: string;
  visual_world?: string;
  color_strategy?: string;
  style_reference?: string;
  creative_direction?: string;
  photography_style?: string;
  camera_strategy?: string;
  lighting_strategy?: string;
  composition_strategy?: string;
  food_scale?: string;
  typography_strategy?: string;
  background_direction?: string;
  negative_space?: string;
  elements_to_highlight?: string[];
  elements_to_avoid?: string[];
  [key: string]: any;
}

export interface StrategistOutput {
  food_profile: FoodProfile;
  advertising_concept: AdvertisingConcept;
  creative_dna: CreativeDNA;
}

export interface ArtDirectorOutput {
  creative_concept: string;
  dominant_emotion?: string;
  artistic_direction?: string;
  headline: string;
  price?: string | null;
  tag?: string | null;
  instagram_caption: string;
  facebook_caption: string;
  hashtags: string[];
  cta: string;
  poster_prompt: string;
  creative_rationale?: string;
}

export interface GenerationResult {
  post: any;
  generatedData: {
    id: string;
    headline: string;
    instagramCaption: string;
    facebookCaption: string;
    caption: string; // caption par défaut (IG)
    hashtags: string[];
    imageUrl: string;
    aspectRatio: AspectRatio;
    campaignType: CampaignType;
    posterPrompt: string;
    foodProfile: FoodProfile;
    advertisingConcept: AdvertisingConcept;
    creativeDNA: CreativeDNA;
  };
}
