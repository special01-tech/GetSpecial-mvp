export interface StyleTemplate {
  key: string;
  label: string;
  poster_family: string;
  lighting: string;
  camera: string;
  background: string;
}

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    key: 'bistro_sunlit',
    label: 'Bistrot Parisien & Lumière Naturelle',
    poster_family: 'Editorial',
    lighting: 'natural_window',
    camera: 'tilted_45deg',
    background: 'warm zinc counter or marble bistro tabletop with soft dining background',
  },
  {
    key: 'street_vibrant',
    label: 'Street Food Moderne & Énergie Graphique',
    poster_family: 'Street Food',
    lighting: 'side_textured',
    camera: 'close_up_macro',
    background: 'clean contemporary slate and vibrant textured background',
  },
  {
    key: 'luxury_minimal',
    label: 'Gastronomie Raffinée & Minimalisme',
    poster_family: 'Luxury',
    lighting: 'soft_diffuse',
    camera: 'depth_field_30deg',
    background: 'minimalist artisanal ceramic plate, airy negative space',
  },
  {
    key: 'terrace_golden',
    label: 'Terrasse & Ambiance Conviviale',
    poster_family: 'Lifestyle',
    lighting: 'evening_warm',
    camera: 'lifestyle_scene',
    background: 'sunny outdoor terrace table, warm golden hour atmosphere',
  },
];

export function resolveDaypartLighting(hour: number = new Date().getHours()): string {
  if (hour >= 6 && hour < 11) return 'fresh morning crisp natural light, clean soft morning rays';
  if (hour >= 11 && hour < 15) return 'bright midday natural window daylight, appetizing fresh clarity';
  if (hour >= 15 && hour < 19) return 'warm afternoon golden hour glow, gentle long soft shadows';
  return 'warm ambient dining candlelight and evening bistro atmosphere';
}

export function selectMaterialSignals(dishName: string): string[] {
  const d = dishName.toLowerCase();
  const signals: string[] = [];
  if (d.includes('burger') || d.includes('grill') || d.includes('steak') || d.includes('chaud') || d.includes('soupe')) {
    signals.push('delicate rising steam');
  }
  if (d.includes('salade') || d.includes('frais') || d.includes('cocktail') || d.includes('bière') || d.includes('boisson')) {
    signals.push('fresh glistening condensation droplets', 'crisp fresh herbs');
  }
  if (d.includes('pain') || d.includes('croissant') || d.includes('frite') || d.includes('pizza') || d.includes('croustillant')) {
    signals.push('golden toasted crunchy flakes and artisan crust textures');
  }
  if (signals.length === 0) {
    signals.push('fresh culinary garnishing', 'mouthwatering authentic food textures');
  }
  return signals;
}
