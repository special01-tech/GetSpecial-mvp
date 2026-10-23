import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { validateSafeExternalUrl } from '@/server/lib/ssrf-guard';

export interface ExtractedDish {
  id: string;
  name: string;
  category: string;
  price: string;
  priceNumeric?: number;
  description?: string;
  isSignature?: boolean;
  dietary?: string[];
  confidence?: number;
}

export interface ExtractedOffer {
  id: string;
  name: string;
  description: string;
  discount: string;
  period: string;
  image?: string;
  platforms?: ('instagram' | 'facebook' | 'google_business')[];
  confidence?: number;
}

export interface MenuExtractionResult {
  source: {
    sourceType: 'pdf' | 'url' | 'image' | 'text';
    name: string;
    url?: string;
    fileSize?: string;
    uploadedAt: string;
  };
  detectedCategories: string[];
  extractedOffers: ExtractedOffer[];
  dishes: ExtractedDish[];
  currency?: string;
  itemsCount: number;
  rawSummary: string;
  rawModelResponse: string;
  parsingError?: string;
  meta: {
    modelUsed: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    durationMs?: number;
    finishReason?: string;
  };
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return success({
    status: 'API Route Active & Opérationnelle',
    route: '/api/menu/extract',
    model: process.env.OPENROUTER_VISION_MODEL || 'google/gemini-3.8-flash',
    features: [
      'fichiers pdf (cartes vectorielles & scans)',
      'images de cartes (jpg, png, webp)',
      'urls directes vers documents pdf ou images',
    ],
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const rate = checkRateLimit(req, 'menu:extract', 8, 60 * 1000);
    if (!rate.allowed) {
      return error(`Trop d'extractions simultanées. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }
    const body = await req.json();
    const {
      sourceType = 'pdf',
      fileName,
      fileSize,
      url,
      pdfBase64,
      imageBase64,
      fileBase64,
      textContent,
      restaurantName,
      model: requestedModel,
    } = body;

    const restName = restaurantName?.trim() || 'Restaurant';

    // Priorisation des données reçues (PDF ou Image)
    let rawDocumentBase64 = pdfBase64 || fileBase64 || imageBase64 || null;

    // Validation : au moins une source doit être spécifiée
    if (!rawDocumentBase64 && !url && !textContent) {
      return error(
        "Aucun document fourni. Veuillez importer un fichier PDF de carte, une image (photo/scan) ou renseigner une URL directe.",
        400
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('...') || apiKey.trim().length < 10) {
      return error(
        "Clé d'API OpenRouter absente ou invalide (OPENROUTER_API_KEY non configurée).",
        500
      );
    }

    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    // Modèle par défaut : Gemini 2.5 Flash (Support natif multimodal documents PDF & Images)
    let selectedModel = requestedModel || process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash';
    if (
      selectedModel === 'google/gemini-2.0-flash-001' ||
      selectedModel === 'google/gemini-flash-1.5' ||
      selectedModel === 'google/gemini-flash'
    ) {
      selectedModel = 'google/gemini-2.5-flash';
    }

    let detectedSourceType = sourceType;
    let documentDataUri: string | null = null;

    // 1. Si une URL distante est fournie
    if (url) {
      if (url.startsWith('data:')) {
        documentDataUri = url;
        detectedSourceType = url.startsWith('data:application/pdf') ? 'pdf' : 'image';
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        const safeUrlCheck = validateSafeExternalUrl(url);
        if (!safeUrlCheck.safe) {
          return error(safeUrlCheck.reason || 'URL non autorisée', 400);
        }
        try {
          const fetchRes = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/pdf,image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (!fetchRes.ok) {
            return error(`Impossible de télécharger le document depuis l'URL (Code HTTP ${fetchRes.status})`, 400);
          }

          const contentType = (fetchRes.headers.get('content-type') || '').toLowerCase();
          const buffer = await fetchRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');

          const isPdf =
            contentType.includes('application/pdf') ||
            url.toLowerCase().endsWith('.pdf') ||
            url.toLowerCase().includes('.pdf?');

          if (isPdf) {
            detectedSourceType = 'pdf';
            documentDataUri = `data:application/pdf;base64,${base64}`;
          } else {
            // Fichier image direct
            detectedSourceType = 'image';
            const mime = contentType.split(';')[0] || 'image/jpeg';
            documentDataUri = `data:${mime};base64,${base64}`;
          }
        } catch (fetchErr: any) {
          return error(`Échec de connexion à l'URL du document (${url}) : ${fetchErr.message || 'Erreur réseau'}`, 400);
        }
      }
    } else if (rawDocumentBase64) {
      // 2. Fichier téléversé directement (Base64)
      const isPdf =
        rawDocumentBase64.startsWith('data:application/pdf') ||
        Boolean(fileName && fileName.toLowerCase().endsWith('.pdf'));

      if (isPdf) {
        detectedSourceType = 'pdf';
        documentDataUri = rawDocumentBase64.startsWith('data:')
          ? rawDocumentBase64
          : `data:application/pdf;base64,${rawDocumentBase64}`;
      } else {
        detectedSourceType = 'image';
        documentDataUri = rawDocumentBase64.startsWith('data:')
          ? rawDocumentBase64
          : `data:image/jpeg;base64,${rawDocumentBase64}`;
      }
    }

    // Prompt système spécialisé dans l'analyse de documents de cartes & menus
    const systemPrompt = `Tu es un extracteur professionnel de cartes et menus pour l'application GetSpecial.
Tu dois analyser ce document de carte/menu pour l'établissement "${restName}". Le document est une carte de restaurant (fichier PDF vectoriel ou scanné, ou photo de carte haute résolution).

CONSIGNES STRICTES POUR ÉCONOMISER LES TOKENS :
1. Extrais UNIQUEMENT les plats réels visibles dans le document. Ne fabrique AUCUN plat.
2. Pour chaque plat, renseigne UNIQUEMENT ces 4 champs indispensables :
   - "name": Nom exact du plat (ex: "Entrecôte Grillée", "Pizza Reine")
   - "category": Catégorie / rubrique du menu (ex: "Entrées", "Plats", "Desserts", "Pizzas", "Grillades", "Boissons")
   - "price": Prix tel qu'affiché sur la carte (ex: "12", "14.50 €", "5 500 FCFA")
   - "description": Ingrédients clés seulement (max 12 mots, omets ou chaîne vide "" si non mentionné)
   - "isSignature": true UNIQUEMENT si explicitement indiqué signature/spécialité (sinon false)
3. Formules ou menus combos (ex: Formule Midi, Menu Dégustation) dans "offers" avec "name", "discount" (le tarif de la formule) et "description" courte.
4. "currency": Symbole ou nom de la devise détectée ($ ou € ou FCFA...).
5. "rawSummary": 1 seule phrase courte résumant le positionnement culinaire de la carte.
6. Ne génère aucun champ superflu, pas de priceNumeric ni de tableaux dietary vides.

RÉPONDS STRICTEMENT AU FORMAT JSON SUIVANT :
{
  "currency": "FCFA",
  "detectedCategories": ["Entrées", "Plats", "Desserts", "Boissons"],
  "rawSummary": "Carte variée proposant des entrées fraîches, grillades et desserts maison.",
  "dishes": [
    {
      "name": "Pizza Royale",
      "category": "Pizzas",
      "price": "6 500 FCFA",
      "description": "Sauce tomate, jambon, champignons de Paris, mozzarella fior di latte",
      "isSignature": false
    }
  ],
  "offers": [
    {
      "name": "Formule Déjeuner Express",
      "discount": "8 500 FCFA",
      "description": "Entrée + Plat ou Plat + Dessert au choix avec boisson"
    }
  ]
}`;

    // Construction du message utilisateur multimodal
    const userContentParts: any[] = [];

    let textInstruction = `Extrais exhaustivement tous les plats, tarifs et formules de cette carte/menu pour "${restName}".`;
    if (textContent) {
      textInstruction += `\n\nINFORMATIONS COMPLÉMENTAIRES :\n${textContent.slice(0, 10000)}`;
    }
    userContentParts.push({ type: 'text', text: textInstruction });

    // Intégration du document PDF ou Image via l'URI universelle supportée par OpenRouter & Gemini
    if (documentDataUri) {
      userContentParts.push({
        type: 'image_url',
        image_url: { url: documentDataUri },
      });
    }

    // Appel à OpenRouter (google/gemini-2.5-flash avec max_tokens: 5000)
    const llmRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://getspecial.app',
        'X-Title': 'GetSpecial PDF Menu Parser',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userContentParts.length === 1 && typeof userContentParts[0].text === 'string'
              ? userContentParts[0].text
              : userContentParts,
          },
        ],
        temperature: 0,
        max_tokens: 5000,
        // Désactive le "thinking" interne de Gemini 2.5 Flash → gain ~5-15s
        thinking: { type: 'disabled' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!llmRes.ok) {
      const errorText = await llmRes.text();
      return error(
        `Erreur retournée par le modèle d'IA (${selectedModel}) : Code ${llmRes.status} — ${errorText}`,
        llmRes.status >= 400 && llmRes.status < 600 ? llmRes.status : 502
      );
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices?.[0]?.message?.content || '';

    if (!rawContent || rawContent.trim().length === 0) {
      return error(
        `Le modèle d'IA (${selectedModel}) a renvoyé une réponse vide lors de la lecture du document.`,
        502
      );
    }

    const usageMeta = {
      modelUsed: llmData.model || selectedModel,
      promptTokens: llmData.usage?.prompt_tokens,
      completionTokens: llmData.usage?.completion_tokens,
      totalTokens: llmData.usage?.total_tokens,
      finishReason: llmData.choices?.[0]?.finish_reason || 'stop',
      durationMs: Date.now() - startTime,
    };

    let extractedDishes: ExtractedDish[] = [];
    let extractedOffers: ExtractedOffer[] = [];
    let detectedCategories: string[] = [];
    let rawSummary = '';
    let currency = '';
    let parsingError: string | undefined = undefined;

    // Décodage JSON robuste avec réparation automatique si tronqué par max_tokens
    let parsed: any = null;
    const jsonMatch = rawContent.match(/\{[\s\S]*/);

    if (jsonMatch) {
      const candidateJson = jsonMatch[0];
      try {
        const cleanMatch = candidateJson.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(cleanMatch ? cleanMatch[0] : candidateJson);
      } catch (firstErr: any) {
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
            parsingError = "Document volumineux : le JSON a été auto-réparé pour récupérer tous les plats complets extraits.";
          } else {
            parsingError = `Échec de décodage JSON : ${firstErr.message}`;
          }
        } catch {
          parsingError = `Échec de décodage JSON : ${firstErr.message}`;
        }
      }
    } else {
      parsingError = "Le modèle d'IA a retourné du texte sans structure JSON.";
    }

    if (parsed) {
      currency = typeof parsed.currency === 'string' ? parsed.currency : '';
      detectedCategories = Array.isArray(parsed.detectedCategories) ? parsed.detectedCategories : [];
      rawSummary = typeof parsed.rawSummary === 'string' ? parsed.rawSummary : '';

      if (Array.isArray(parsed.dishes)) {
        extractedDishes = parsed.dishes
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
          });
      }

      if (Array.isArray(parsed.offers)) {
        extractedOffers = parsed.offers
          .filter((off: any) => off && (off.name || off.discount || off.price))
          .map((off: any, idx: number) => ({
            id: `menu_ext_${Date.now()}_${idx + 1}`,
            name: String(off.name || '').trim(),
            description: String(off.description || '').trim(),
            discount: String(off.discount || off.price || '').trim(),
            period: String(off.period || '').trim(),
            platforms: ['instagram', 'facebook', 'google_business'] as ('instagram' | 'facebook' | 'google_business')[],
          }));
      }

      if (detectedCategories.length === 0 && extractedDishes.length > 0) {
        detectedCategories = Array.from(new Set(extractedDishes.map(d => d.category).filter(Boolean)));
      }
    }

    const result: MenuExtractionResult = {
      source: {
        sourceType: detectedSourceType as any,
        name: fileName || url || (detectedSourceType === 'pdf' ? 'menu_carte.pdf' : 'menu_source'),
        url: url || undefined,
        fileSize: fileSize || undefined,
        uploadedAt: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      detectedCategories,
      extractedOffers,
      dishes: extractedDishes,
      currency,
      itemsCount: extractedDishes.length + extractedOffers.length,
      rawSummary,
      rawModelResponse: rawContent,
      parsingError,
      meta: usageMeta,
    };

    return success(result);
  } catch (err: any) {
    console.error('[MENU_EXTRACT_API_FATAL]', err);
    return error(`Erreur interne lors de l'analyse du menu : ${err.message || String(err)}`, 500);
  }
}
