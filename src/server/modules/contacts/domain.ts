export interface SaveContactParams {
  restaurantId: string;
  offerId?: string;
  type: 'email' | 'phone';
  value: string;
  consentText: string;
  source?: string;
}

export function validateContact(params: SaveContactParams): { isValid: boolean; error?: string } {
  if (!params.consentText || params.consentText.trim().length === 0) {
    return { isValid: false, error: 'Le consentement explicite est obligatoire.' };
  }

  const val = params.value?.trim();
  if (!val) {
    return { isValid: false, error: 'Coordonnée manquante.' };
  }

  if (params.type === 'email' && !val.includes('@')) {
    return { isValid: false, error: 'Format email invalide.' };
  }

  if (params.type === 'phone' && val.length < 8) {
    return { isValid: false, error: 'Numéro de téléphone incomplet.' };
  }

  return { isValid: true };
}
