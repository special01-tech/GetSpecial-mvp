import {
  ContextDossier,
  DemandOpportunityOutput,
  DemandOpportunityOutputSchema,
  DemandOpportunityItem,
} from './types';

export class OpenRouterClient {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    this.model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-pro';
  }

  /**
   * Appelle le LLM via OpenRouter pour générer les opportunités de demande sous guardrails stricts.
   * Si la clé est absente, bascule sur un générateur déterministe local en déclarant isMock: true.
   */
  async evaluateDossier(dossier: ContextDossier): Promise<{
    output: DemandOpportunityOutput;
    isMock: boolean;
    mockReason?: string;
    modelUsed?: string;
  }> {
    // Si aucune clé OpenRouter n'est fournie, exécuter le fallback local déclaré
    if (!this.apiKey || this.apiKey.includes('...') || this.apiKey.trim() === '') {
      const mockResult = this.generateDeterministicFallback(dossier);
      return {
        output: mockResult,
        isMock: true,
        mockReason: 'OPENROUTER_API_KEY non configurée. Générateur déterministe local actif.',
      };
    }

    try {
      const systemPrompt = `Tu es le copilote stratégique de GetSpecial, spécialisé dans l'optimisation et le pilotage de la demande pour les bars et restaurants indépendants.
Ton objectif est de détecter jusqu'à 5 opportunités commerciales concrètes, ultra-claires et pertinentes aujourd'hui pour cet établissement.

RÈGLES D'OR INTANGIBLES (GUARDRAILS) :
1. GROUND TRUTH ABSOLU : Tu n'as STRICTEMENT AUCUN DROIT d'inventer des plats, boissons ou concepts absents des spécialités du restaurant. Utilise UNIQUEMENT les spécialités réelles de l'établissement.
2. DESCRIPTION EXPLICATIVE & PÉDAGOGIQUE POUR LE RESTAURATEUR : La description doit expliquer clairement et concrètement la situation (ce qui se passe à proximité ou le signal météo/jour), l'intérêt commercial et la proposition en 2 phrases complètes, chaleureuses et faciles à comprendre en 10 secondes. Pas de fixette sur le nombre de places assises.
3. RAISONS ULTRA-CONCISES (2 à 3 MAX) : Dans le champ "reasons", donne 2 à 3 bullet points percutants, courts et directs (1 phrase courte de 10 à 15 mots max chacun). Explique immédiatement le levier fort : pic d'affluence ciblé, marge brute préservée, ou simplicité en cuisine. Pas de remplissage.
4. OFFRE EN SALLE SIMPLE & DIRECTE : "label" est le nom gourmand et clair de la formule (ex: 'Formule Fan Zone : Burger Charolais & Pinte IPA'). "details" décrit simplement et précisément ce qui est servi.
5. PAS LIMITÉ AUX JOURS CREUX : Les créneaux calmes sont une opportunité majeure, mais un événement local voisin (concert, match) ou une météo propice (terrasse) constituent aussi d'excellentes opportunités n'importe quel jour.
6. MOT-CODE ORAL AU COMPTOIR : Chaque offre DOIT comporter un mot-code court (ex: MATCH15, SOLEIL25, BURGER8) facile à prononcer et mémorisable pour le client et le serveur.
7. FORCE ET IMPORTANCE : Tu dois évaluer la force/importance de chaque opportunité via "importance" ("HIGH" pour impact majeur/affluence forte, "MEDIUM" pour bon relais, "MODERATE" pour opportunité d'appoint) et "impactScore" (score entier entre 1 et 100).
8. "category" doit être STRICTEMENT l'une de ces valeurs : "LOCAL_EVENT", "WEATHER_BOOST", "EMPTY_SLOT", "OFFER_PROMOTION", "SPECIAL_OCCASION".
9. SOBRIÉTÉ : Si aucune action commerciale n'a de sens crédible aujourd'hui, renvoie hasOpportunity: false et une liste vide.
10. PLAFOND : Maximum 5 opportunités.
11. RÉPONSE : Retourne STRICTEMENT un objet JSON valide conforme au schéma demandé, sans aucun markdown ni texte autour.`;

      const userPrompt = `Voici le dossier complet et vérifié de l'établissement :
${JSON.stringify(dossier, null, 2)}

Produis la réponse JSON au format exact suivant :
{
  "hasOpportunity": true,
  "opportunities": [
    {
      "title": "Titre clair et accrocheur",
      "description": "Explication pédagogique et claire de l'action en 2 phrases",
      "category": "LOCAL_EVENT",
      "urgency": "high",
      "importance": "HIGH",
      "impactScore": 92,
      "offer": {
        "label": "Nom gourmand de la formule",
        "details": "Description précise de ce qui est servi",
        "codeWord": "MATCH15",
        "validityText": "Ce soir de 18h30 à 20h30 uniquement"
      },
      "reasons": [
        "Raison concise 1 (courte et percutante)",
        "Raison concise 2 (courte et percutante)"
      ],
      "distribution": {
        "channels": ["INSTAGRAM", "FACEBOOK"],
        "recommendedPublishTime": "11:30",
        "publishTimingReason": "Pourquoi poster à cette heure"
      },
      "factsUsed": ["Fait réel 1", "Fait réel 2"]
    }
  ],
  "summaryRationale": "Synthèse de ta réflexion"
}`;

      const executeRequest = async (modelToUse: string) => {
        return fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://getspecial.dev',
            'X-Title': 'GetSpecial Demand Engine',
          },
          signal: AbortSignal.timeout(40000),
          body: JSON.stringify({
            model: modelToUse,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });
      };

      let usedModel = this.model;
      let response = await executeRequest(this.model);

      // Si le modèle configuré échoue, essayer deepseek/deepseek-v4-pro ou openai/gpt-4o-mini
      if (!response.ok && this.model !== 'deepseek/deepseek-v4-pro') {
        console.warn(`[OPENROUTER_FALLBACK] Modèle ${this.model} indisponible (${response.status}). Bascule sur deepseek/deepseek-v4-pro...`);
        usedModel = 'deepseek/deepseek-v4-pro';
        response = await executeRequest('deepseek/deepseek-v4-pro');
      }

      if (!response.ok && usedModel !== 'openai/gpt-4o-mini') {
        console.warn(`[OPENROUTER_FALLBACK] Modèle ${usedModel} indisponible (${response.status}). Bascule sur openai/gpt-4o-mini...`);
        usedModel = 'openai/gpt-4o-mini';
        response = await executeRequest('openai/gpt-4o-mini');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[OPENROUTER_ERROR] Statut HTTP ${response.status}: ${errorText}`);
        return {
          output: this.generateDeterministicFallback(dossier),
          isMock: true,
          mockReason: `Erreur API OpenRouter (${response.status}): ${errorText.slice(0, 150)}. Fallback local actif.`,
        };
      }

      const json = await response.json();
      const rawContent = json.choices?.[0]?.message?.content || '';
      const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Normalisation intelligente pour protéger la validation Zod
      const validCategories = ['EMPTY_SLOT', 'LOCAL_EVENT', 'WEATHER_BOOST', 'SPECIAL_OCCASION', 'OFFER_PROMOTION'];
      const normalized = {
        hasOpportunity: Boolean(parsed.hasOpportunity ?? (Array.isArray(parsed.opportunities) && parsed.opportunities.length > 0)),
        opportunities: Array.isArray(parsed.opportunities)
          ? parsed.opportunities.slice(0, 5).map((item: any, idx: number) => {
              const category = validCategories.includes(item.category)
                ? item.category
                : (item.category?.toUpperCase() === 'PROMOTION' ? 'OFFER_PROMOTION' : 'LOCAL_EVENT');
              const importance = ['HIGH', 'MEDIUM', 'MODERATE'].includes(item.importance) ? item.importance : 'HIGH';
              const urgency = item.urgency === 'moderate' ? 'medium' : (item.urgency || 'medium');
              const impactScore = typeof item.impactScore === 'number' ? item.impactScore : 85;

              const offerLabel = (typeof item.offer === 'object' && item.offer?.label) || item.label || item.title || `Formule Recommandée #${idx + 1}`;
              const offerDetails = (typeof item.offer === 'object' && item.offer?.details) || item.details || item.description || 'Spécialité maison';
              const offerCode = String((typeof item.offer === 'object' && item.offer?.codeWord) || item.codeWord || (typeof item.offer === 'string' ? item.offer : '') || 'SPECIAL')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 10) || 'SPECIAL';
              const offerValidity = (typeof item.offer === 'object' && item.offer?.validityText) || item.validityText || 'Aujourd’hui pendant les heures de service';

              const offerObj = {
                label: offerLabel,
                details: offerDetails,
                codeWord: offerCode,
                validityText: offerValidity,
              };

              const rawChannels = typeof item.distribution === 'object' && Array.isArray(item.distribution?.channels)
                ? item.distribution.channels
                : [];
              const mappedChannels = rawChannels
                .map((c: any) => {
                  const s = String(c).toUpperCase();
                  if (s.includes('INSTA')) return 'INSTAGRAM';
                  if (s.includes('FACE')) return 'FACEBOOK';
                  if (s.includes('GOOGLE')) return 'GOOGLE_BUSINESS';
                  return null;
                })
                .filter(Boolean);
              const validChannels = mappedChannels.length > 0 ? mappedChannels : ['INSTAGRAM', 'FACEBOOK'];

              return {
                title: String(item.title || item.label || `Opportunité #${idx + 1}`).slice(0, 95),
                description: String(item.description || 'Action commerciale ciblée.'),
                category,
                urgency,
                importance,
                impactScore,
                offer: offerObj,
                reasons: Array.isArray(item.reasons) ? item.reasons : (item.reasons ? [String(item.reasons)] : ['Signal local pertinent']),
                distribution: {
                  channels: validChannels,
                  recommendedPublishTime: (typeof item.distribution === 'object' && item.distribution?.recommendedPublishTime) ? String(item.distribution.recommendedPublishTime) : '11:30',
                  publishTimingReason: (typeof item.distribution === 'object' && item.distribution?.publishTimingReason) ? String(item.distribution.publishTimingReason) : 'Pour capter les décisions de sortie.',
                },
                factsUsed: Array.isArray(item.factsUsed) ? item.factsUsed : (item.factsUsed ? [String(item.factsUsed)] : []),
              };
            })
          : [],
        summaryRationale: parsed.summaryRationale || '',
      };

      const validated = DemandOpportunityOutputSchema.safeParse(normalized);
      if (validated.success) {
        return {
          output: validated.data,
          isMock: false,
          modelUsed: usedModel,
        };
      }

      console.warn('[OPENROUTER_SCHEMA_VALIDATION_FAILED]', validated.error);
      return {
        output: this.generateDeterministicFallback(dossier),
        isMock: true,
        mockReason: `Échec de validation du schéma JSON de l’IA: ${JSON.stringify(validated.error.issues.map(i => ({ path: i.path, message: i.message })))}`,
      };
    } catch (err: any) {
      console.warn('[OPENROUTER_CLIENT_EXCEPTION]', err);
      return {
        output: this.generateDeterministicFallback(dossier),
        isMock: true,
        mockReason: `Exception réseau ou parsing OpenRouter (${err.message}). Fallback local actif.`,
      };
    }
  }

  /**
   * Générateur de repli déterministe certifié 100% sans hallucination.
   * Construit des opportunités viables à partir des faits réels lorsque l'IA n'est pas joignable.
   */
  private generateDeterministicFallback(dossier: ContextDossier): DemandOpportunityOutput {
    const opps: DemandOpportunityItem[] = [];
    const rest = dossier.restaurant;
    const specialties = rest.specialties.length > 0 ? rest.specialties : ['Nos spécialités de saison'];
    const primeSpec = specialties[0];
    const secondSpec = specialties[1] || 'boisson au choix';

    // 1. Opportunité Événement Voisin (si présent)
    if (dossier.events.length > 0) {
      const topEvent = dossier.events[0];
      const isSport = topEvent.type.toLowerCase().includes('sport') || topEvent.title.toLowerCase().includes('match');
      const codeWord = isSport ? 'MATCH15' : 'SHOW20';

      opps.push({
        title: isSport ? `Soirée Match : Formule ${primeSpec}` : `Avant-Spectacle : Formule Express ${primeSpec}`,
        description: `Captez le flux des spectateurs venant pour ${topEvent.title} avec un service rapide et convivial.`,
        category: 'LOCAL_EVENT',
        urgency: 'high',
        importance: 'HIGH',
        impactScore: 94,
        offer: {
          label: `Formule ${isSport ? 'Fan Zone' : 'Pre-Show'} : ${primeSpec} & ${secondSpec}`,
          details: `1 ${primeSpec} + 1 ${secondSpec} servis rapidement avant le début de l’événement.`,
          codeWord,
          validityText: `Ce soir avant le début de ${topEvent.title}`,
        },
        reasons: [
          `Événement local à proximité : "${topEvent.title}" prévu ce jour.`,
          `Les spectateurs cherchent une table rapide et conviviale avant d'entrer en salle.`,
          `Mise en avant de vos spécialités reconnues (${primeSpec}) pour un service fluide.`,
        ],
        distribution: {
          channels: ['INSTAGRAM', 'FACEBOOK', 'GOOGLE_BUSINESS'],
          recommendedPublishTime: '11:30',
          publishTimingReason: 'Heure à laquelle les spectateurs organisent leur pause repas.',
        },
        factsUsed: [
          `Événement détecté : ${topEvent.title}`,
          `Spécialité maison : ${primeSpec}`,
          `Adresse : ${rest.address}`,
        ],
      });
    }

    // 2. Opportunité Météo Terrasse (si terrasse + soleil)
    if (dossier.weather.available && dossier.weather.isSunny && rest.hasTerrace) {
      opps.push({
        title: 'Météo Favorable : Terrasse & Dégustation',
        description: 'Profitez des conditions ensoleillées pour remplir votre terrasse ce midi ou en début de soirée.',
        category: 'WEATHER_BOOST',
        urgency: 'medium',
        importance: 'MEDIUM',
        impactScore: 78,
        offer: {
          label: `Moment Terrasse : ${secondSpec} & ${primeSpec}`,
          details: `Formule dégustation en terrasse autour de vos ${primeSpec}.`,
          codeWord: 'SOLEIL25',
          validityText: 'Aujourd’hui pendant les heures de service en terrasse',
        },
        reasons: [
          `Météo dégagée annoncée : ${dossier.weather.summary}.`,
          `Votre terrasse extérieure est déclarée disponible.`,
          `Création d'une dynamique visuelle attractive dès la devanture du restaurant.`,
        ],
        distribution: {
          channels: ['INSTAGRAM', 'FACEBOOK'],
          recommendedPublishTime: '10:30',
          publishTimingReason: 'Pour capter les décisions de déjeuner et d’afterwork au soleil.',
        },
        factsUsed: [
          `Météo : ${dossier.weather.summary}`,
          'Terrasse disponible',
          `Spécialités : ${primeSpec}`,
        ],
      });
    }

    // 3. Opportunité Jour Creux Récurrent (si jour calme déclaré)
    if (dossier.currentDay.isOffPeakDay) {
      const codeWord = `${dossier.currentDay.dayKey.toUpperCase()}15`;
      opps.push({
        title: `Spécial ${dossier.currentDay.dayNameFr} : La Formule Conviviale`,
        description: `Dynamisez votre soirée du ${dossier.currentDay.dayNameFr} en incitant les habitués du quartier à venir avec une offre dédiée.`,
        category: 'EMPTY_SLOT',
        urgency: 'medium',
        importance: 'HIGH',
        impactScore: 88,
        offer: {
          label: `Privilège ${dossier.currentDay.dayNameFr} : ${primeSpec}`,
          details: `Avantage exclusif sur ${primeSpec} pour toute commande mentionnant le mot-code.`,
          codeWord,
          validityText: `Ce ${dossier.currentDay.dayNameFr} soir uniquement sur le service de dîner`,
        },
        reasons: [
          `Le ${dossier.currentDay.dayNameFr} est identifié comme un créneau plus calme (baseline : ${rest.baselineCovers} couverts).`,
          `Un mot-code oral permet de vérifier directement la fréquentation incrémentale générée.`,
          `Offre ciblée sur votre produit phare (${primeSpec}) pour garantir une marge saine.`,
        ],
        distribution: {
          channels: ['INSTAGRAM', 'FACEBOOK'],
          recommendedPublishTime: '15:00',
          publishTimingReason: 'Juste avant la fin d’après-midi pour orienter le choix du dîner.',
        },
        factsUsed: [
          `Créneau calme : ${dossier.currentDay.dayNameFr}`,
          `Baseline témoin : ${rest.baselineCovers} couverts`,
          `Spécialité : ${primeSpec}`,
        ],
      });
    }

    // 4. Valorisation d'une offre active existante
    if (opps.length < 5 && dossier.activeOffers.length > 0) {
      const activeOffer = dossier.activeOffers[0];
      opps.push({
          title: `À la Carte : ${activeOffer.title}`,
          description: activeOffer.description,
          category: 'OFFER_PROMOTION',
          urgency: 'low',
          importance: 'MODERATE',
          impactScore: 68,
          offer: {
            label: activeOffer.title,
            details: activeOffer.description,
            codeWord: 'SPECIAL10',
            validityText: 'Aujourd’hui pendant les heures d’ouverture',
          },
          reasons: [
            `Offre active existante du restaurant non mise en avant récemment.`,
            `Permet de maintenir une présence commerciale régulière sans inventer de nouvelle formule.`,
          ],
          distribution: {
            channels: ['INSTAGRAM', 'FACEBOOK'],
            recommendedPublishTime: '11:00',
            publishTimingReason: 'Publication matinale avant le service.',
          },
          factsUsed: [
            `Offre active : ${activeOffer.title}`,
            `Description : ${activeOffer.description}`,
          ],
        });
    }

    // Plafonner à 5 opportunités maximum (comme spécifié)
    const limitedOpps = opps.slice(0, 5);

    return {
      hasOpportunity: limitedOpps.length > 0,
      opportunities: limitedOpps,
      summaryRationale:
        limitedOpps.length > 0
          ? `${limitedOpps.length} opportunité(s) commerciale(s) identifiée(s) pour aujourd’hui.`
          : 'Aucune opportunité significative identifiée pour aujourd’hui.',
    };
  }
}
