import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { checkRateLimit } from '@/server/lib/rate-limit';

export interface ExtractedDish {
  id: string;
  name: string;
  category: string;
  price: string;
  priceNumeric?: number;
  description?: string;
  isSignature?: boolean;
  dietary?: string[];
}

export interface ExtractedOffer {
  id: string;
  name: string;
  description: string;
  discount: string;
  period: string;
  platforms?: ('instagram' | 'facebook' | 'google_business')[];
}

export interface MenuExtractionResult {
  source: {
    sourceType: 'pdf' | 'image';
    name: string;
    fileSize?: string;
    uploadedAt: string;
  };
  detectedCategories: string[];
  extractedOffers: ExtractedOffer[];
  dishes: ExtractedDish[];
  currency?: string;
  itemsCount: number;
  rawSummary: string;
  meta: {
    modelUsed: string;
    durationMs?: number;
  };
}

export const dynamic = 'force-dynamic';

// Taille maximale acceptée : ~15 Mo de fichier binaire (~21 Mo en base64)
const MAX_BASE64_LENGTH = 22 * 1024 * 1024;

export async function GET() {
  return success({
    status: 'API Route Active & Opérationnelle',
    route: '/api/menu/extract',
    features: ['fichiers pdf (cartes vectorielles & scans)', 'images de cartes (jpg, png, webp)'],
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const rate = checkRateLimit(req, 'menu:extract', 8, 60 * 1000);
    if (!rate.allowed) {
      return error(
        `Trop d'analyses simultanées. Veuillez patienter ${rate.retryAfterSec}s avant de réessayer.`,
        429
      );
    }

    const body = await req.json();
    const {
      sourceType = 'pdf',
      fileName,
      fileSize,
      pdfBase64,
      imageBase64,
      fileBase64,
      restaurantName,
      model: requestedModel,
    } = body;

    const restName = restaurantName?.trim() || 'Restaurant';
    const rawDocumentBase64: string | null = pdfBase64 || fileBase64 || imageBase64 || null;

    // 1. Validation de l'entrée utilisateur (Erreurs 400 / 413 explicites pour l'utilisateur)
    if (!rawDocumentBase64 || typeof rawDocumentBase64 !== 'string') {
      return error(
        'Aucun fichier reçu. Veuillez sélectionner un PDF ou une photo de votre carte.',
        400
      );
    }

    if (rawDocumentBase64.length > MAX_BASE64_LENGTH) {
      return error(
        'Le fichier sélectionné est trop volumineux (maximum autorisé : 15 Mo).',
        413
      );
    }

    const isPdf =
      sourceType === 'pdf' ||
      rawDocumentBase64.startsWith('data:application/pdf') ||
      Boolean(fileName && fileName.toLowerCase().endsWith('.pdf'));

    const isSupportedImage =
      !isPdf &&
      (sourceType === 'image' ||
        rawDocumentBase64.startsWith('data:image/jpeg') ||
        rawDocumentBase64.startsWith('data:image/jpg') ||
        rawDocumentBase64.startsWith('data:image/png') ||
        rawDocumentBase64.startsWith('data:image/webp') ||
        Boolean(fileName && /\.(jpe?g|png|webp)$/i.test(fileName)));

    if (!isPdf && !isSupportedImage) {
      return error(
        'Format de fichier non pris en charge. Importez un document PDF ou une image (JPG, PNG, WEBP).',
        400
      );
    }

    const detectedSourceType: 'pdf' | 'image' = isPdf ? 'pdf' : 'image';
    const documentDataUri = rawDocumentBase64.startsWith('data:')
      ? rawDocumentBase64
      : isPdf
      ? `data:application/pdf;base64,${rawDocumentBase64}`
      : `data:image/jpeg;base64,${rawDocumentBase64}`;

    // 2. Vérification de la configuration serveur (Erreur interne masquée à l'utilisateur)
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('...') || apiKey.trim().length < 10) {
      console.error('[MENU_EXTRACT_CONFIG_ERROR] OPENROUTER_API_KEY manquante ou invalide.');
      return error(
        'Le service d’analyse automatique est momentanément indisponible. Veuillez réessayer plus tard.',
        503
      );
    }

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    let selectedModel = requestedModel || process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash';
    if (
      selectedModel === 'google/gemini-2.0-flash-001' ||
      selectedModel === 'google/gemini-flash-1.5' ||
      selectedModel === 'google/gemini-flash'
    ) {
      selectedModel = 'google/gemini-2.5-flash';
    }

    const systemPrompt = `Tu es un extracteur professionnel de cartes et menus pour l'application GetSpecial.
Tu dois analyser ce document de carte/menu pour l'établissement "${restName}".

CONSIGNES STRICTES :
1. Extrais UNIQUEMENT les plats réels visibles dans le document. Ne fabrique AUCUN plat.
2. Pour chaque plat, renseigne ces champs :
   - "name": Nom exact du plat
   - "category": Rubrique du menu (ex: "Entrées", "Plats", "Desserts", "Pizzas", "Boissons")
   - "price": Prix tel qu'affiché sur la carte (ex: "14,50 €", "5 500 FCFA")
   - "description": Ingrédients clés (max 12 mots, "" si non mentionné)
   - "isSignature": true UNIQUEMENT si explicitement indiqué spécialité/signature (sinon false)
3. Formules ou menus combos dans "offers" avec "name", "discount" (tarif) et "description" courte.
4. "currency": Symbole ou code de la devise détectée.
5. "rawSummary": 1 phrase courte résumant le positionnement culinaire de la carte.

RÉPONDS STRICTEMENT AU FORMAT JSON SUIVANT :
{
  "currency": "€",
  "detectedCategories": ["Entrées", "Plats", "Desserts"],
  "rawSummary": "Carte bistrot proposant des entrées fraîches, grillades et desserts maison.",
  "dishes": [
    {
      "name": "Entrecôte Grillée",
      "category": "Plats",
      "price": "22,00 €",
      "description": "Sauce au poivre maison et frites fraîches",
      "isSignature": false
    }
  ],
  "offers": [
    {
      "name": "Formule Déjeuner",
      "discount": "16,50 €",
      "description": "Entrée + Plat ou Plat + Dessert"
    }
  ]
}`;

    const llmRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://getspecial.app',
        'X-Title': 'GetSpecial Menu Parser',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extrais exhaustivement tous les plats, tarifs et formules de cette carte pour "${restName}".`,
              },
              {
                type: 'image_url',
                image_url: { url: documentDataUri },
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 5000,
        thinking: { type: 'disabled' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!llmRes.ok) {
      const errorText = await llmRes.text();
      console.error(`[MENU_EXTRACT_LLM_ERROR] HTTP ${llmRes.status} (${selectedModel}):`, errorText);
      return error(
        'L’analyse automatique de la carte est temporairement indisponible. Veuillez réessayer.',
        502
      );
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content || '';

    if (!rawContent || rawContent.trim().length === 0) {
      console.error('[MENU_EXTRACT_EMPTY_RESPONSE]', llmData);
      return error(
        'Aucun texte lisible n’a pu être détecté sur ce document. Vérifiez que le fichier est net et lisible.',
        422
      );
    }

    // Décodage JSON résilient avec réparation automatique si tronqué
    let parsed: any = null;
    const jsonMatch = rawContent.match(/\{[\s\S]*/);
    if (jsonMatch) {
      const candidateJson = jsonMatch[0];
      try {
        const cleanMatch = candidateJson.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(cleanMatch ? cleanMatch[0] : candidateJson);
      } catch {
        try {
          const lastObjEnd = candidateJson.lastIndexOf('}');
          if (lastObjEnd !== -1) {
            let repaired = candidateJson.slice(0, lastObjEnd + 1).replace(/,\s*$/, '');
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            for (let b = 0; b < openBrackets - closeBrackets; b++) repaired += '\n]';
            for (let c = 0; c < openBraces - closeBraces; c++) repaired += '\n}';
            parsed = JSON.parse(repaired);
          }
        } catch (repairErr) {
          console.error('[MENU_EXTRACT_JSON_PARSE_ERROR]', repairErr, rawContent.slice(0, 500));
        }
      }
    }

    if (!parsed) {
      return error(
        'Le document n’a pas pu être lu comme une carte de restaurant. Assurez-vous que les plats et tarifs y sont bien visibles.',
        422
      );
    }

    const currency = typeof parsed.currency === 'string' ? parsed.currency : '';
    const rawSummary = typeof parsed.rawSummary === 'string' ? parsed.rawSummary : '';
    let detectedCategories: string[] = Array.isArray(parsed.detectedCategories)
      ? parsed.detectedCategories
      : [];

    const extractedDishes: ExtractedDish[] = Array.isArray(parsed.dishes)
      ? parsed.dishes
          .filter((d: any) => d && (d.name || d.price))
          .map((d: any, idx: number) => {
            const rawPrice = String(d.price || '').trim();
            const numericVal = parseFloat(rawPrice.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return {
              id: `dish_${Date.now()}_${idx + 1}`,
              name: String(d.name || '').trim(),
              category: String(d.category || 'Plats').trim(),
              price: rawPrice,
              priceNumeric: !isNaN(numericVal) ? numericVal : undefined,
              description: typeof d.description === 'string' ? d.description.trim() : '',
              isSignature: Boolean(d.isSignature),
              dietary: Array.isArray(d.dietary) ? d.dietary.map(String) : [],
            };
          })
      : [];

    const extractedOffers: ExtractedOffer[] = Array.isArray(parsed.offers)
      ? parsed.offers
          .filter((off: any) => off && (off.name || off.discount || off.price))
          .map((off: any, idx: number) => ({
            id: `menu_ext_${Date.now()}_${idx + 1}`,
            name: String(off.name || '').trim(),
            description: String(off.description || '').trim(),
            discount: String(off.discount || off.price || '').trim(),
            period: String(off.period || 'Toute la semaine').trim(),
            platforms: ['instagram', 'facebook', 'google_business'],
          }))
      : [];

    if (extractedDishes.length === 0 && extractedOffers.length === 0) {
      return error(
        'Aucun plat ni formule n’a été détecté dans ce fichier. Vérifiez que l’image ou le PDF contient bien le texte de votre menu.',
        422
      );
    }

    if (detectedCategories.length === 0 && extractedDishes.length > 0) {
      detectedCategories = Array.from(new Set(extractedDishes.map((d) => d.category).filter(Boolean)));
    }

    const result: MenuExtractionResult = {
      source: {
        sourceType: detectedSourceType,
        name: fileName || (detectedSourceType === 'pdf' ? 'menu_carte.pdf' : 'photo_carte.jpg'),
        fileSize: fileSize || undefined,
        uploadedAt: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      },
      detectedCategories,
      extractedOffers,
      dishes: extractedDishes,
      currency,
      itemsCount: extractedDishes.length + extractedOffers.length,
      rawSummary,
      meta: {
        modelUsed: llmData.model || selectedModel,
        durationMs: Date.now() - startTime,
      },
    };

    return success(result);
  } catch (err: any) {
    console.error('[MENU_EXTRACT_API_FATAL]', err);
    return error(
      'Une erreur temporaire est survenue lors de la lecture du document. Veuillez réessayer.',
      500
    );
  }
}
