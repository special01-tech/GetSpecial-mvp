export interface EstablishmentTypeOption {
  id: string;
  name: string;
  description?: string;
  iconName: string;
}

export const ESTABLISHMENT_TYPES: EstablishmentTypeOption[] = [
  {
    id: 'casual_dining',
    name: 'Casual Dining',
    description: 'Full-service, sit-down American dining',
    iconName: 'UtensilsCrossed',
  },
  {
    id: 'sports_bar',
    name: 'Sports Bar & Grill',
    description: 'Big screens, craft beer, game day wings',
    iconName: 'Trophy',
  },
  {
    id: 'fast_casual',
    name: 'Fast Casual',
    description: 'Quick counter service, fresh high quality',
    iconName: 'Sandwich',
  },
  {
    id: 'bar_lounge',
    name: 'Bar & Cocktail Lounge',
    description: 'Craft cocktails, Happy Hour & nightlife',
    iconName: 'Wine',
  },
  {
    id: 'food_truck',
    name: 'Food Truck & Pop-up',
    description: 'Mobile street food & outdoor dining',
    iconName: 'Store',
  },
  {
    id: 'brunch_cafe',
    name: 'Brunch & Specialty Café',
    description: 'Breakfast, weekend brunch, artisan espresso',
    iconName: 'Coffee',
  },
  {
    id: 'pizzeria',
    name: 'Pizzeria & Italian',
    description: 'Wood-fired pies, slice shop, pasta',
    iconName: 'Pizza',
  },
  {
    id: 'fine_dining',
    name: 'Fine Dining & Steakhouse',
    description: 'Upscale dining, reservations & wine lists',
    iconName: 'Beer',
  },
];
