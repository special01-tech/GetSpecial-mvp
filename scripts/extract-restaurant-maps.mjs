import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Charge les variables d'environnement depuis .env.local et .env de manière autonome
 */
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

/**
 * Résout les redirections d'une URL courte Google Maps (maps.app.goo.gl, etc.)
 * et extrait les métadonnées HTML de base si accessibles.
 */
async function resolveAndScrapeMapsUrl(url) {
  console.log(`🔍 [1/3] Résolution de l'URL Google Maps : ${url}`);
  let finalUrl = url;
  let pageTitle = '';
  let metaDescription = '';
  let ogImage = '';
  let rawHtmlSnippet = '';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    finalUrl = response.url || url;
    console.log(`📍 [1/3] URL finale résolue : ${finalUrl}`);

    const html = await response.text();
    rawHtmlSnippet = html.slice(0, 15000);

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    if (titleMatch) pageTitle = titleMatch[1].trim();

    const descMatch =
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
    if (descMatch) metaDescription = descMatch[1].trim();

    const imgMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
    if (imgMatch) ogImage = imgMatch[1].trim();
  } catch (err) {
    console.warn(`⚠️ [1/3] Avertissement lors de la résolution de l'URL :`, err.message);
  }

  // Extraction d'indices d'URL (coordonnées GPS, nom encodé dans le chemin)
  let urlHintName = '';
  let lat = null;
  let lng = null;

  try {
    const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/);
    if (placeMatch && placeMatch[1]) {
      urlHintName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    const coordsMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lng = parseFloat(coordsMatch[2]);
    }
  } catch (e) {
    // Non bloquant
  }

  return {
    originalUrl: url,
    finalUrl,
    pageTitle,
    metaDescription,
    ogImage,
    urlHintName,
    coordinates: lat && lng ? { latitude: lat, longitude: lng } : null,
    htmlSnippet: rawHtmlSnippet,
  };
}

/**
 * Appelle Claude via OpenRouter pour analyser et extraire toutes les données
 */
export async function extractRestaurantFromMaps(mapsUrl) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Clé OPENROUTER_API_KEY manquante dans l'environnement ou dans .env.local");
  }

  const scraped = await resolveAndScrapeMapsUrl(mapsUrl);

  const dossierObject = {
    name: scraped.urlHintName || scraped.pageTitle || 'Inconnu',
    url: scraped.finalUrl,
    pageTitle: scraped.pageTitle || null,
    metaDescription: scraped.metaDescription || null,
    coordinates: scraped.coordinates || null,
    photoUrl: scraped.ogImage || null,
  };

  const dossierJson = JSON.stringify(dossierObject, null, 2);

  const systemPrompt = `Tu structures des données de restaurants. Tu réponds uniquement avec un objet JSON valide, sans texte autour.
Règle absolue : tu n'utilises que les données fournies. Si une information n'est pas dans le dossier, tu mets null (ou [] pour une liste). Tu n'inventes jamais une adresse, des horaires, un nombre d'avis, un site web ou un réseau social.`;

  const userPrompt = `Voici le dossier d'un restaurant :
${dossierJson}

Retourne ce JSON :
{
  "tagline": string | null,
  "description": string | null,
  "cuisineType": string[],
  "establishmentType": "restaurant" | "bistrot" | "brasserie" | "bar_restaurant" | "cafe" | null,
  "priceRange": "€" | "€€" | "€€€" | "€€€€" | null,
  "specialties": string[],
  "features": string[],
  "atmosphere": string | null,
  "fieldsInferred": string[],
  "confidenceScore": number
}

Consignes :
- "description" et "tagline" : 1 à 2 phrases, basées uniquement sur les éléments du dossier.
- "specialties" : uniquement ce qui apparaît dans les avis ou le dossier.
- "fieldsInferred" : liste les champs que tu as déduits sans source explicite.
- "confidenceScore" : entre 0 et 1, bas si le dossier est pauvre.`;

  // Liste des modèles par ordre de priorité
  const models = [
    'anthropic/claude-3.7-sonnet',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
  ];

  let rawContent = '';
  let usedModel = models[0];

  for (const model of models) {
    try {
      console.log(`🤖 Tentative avec le modèle : ${model}...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://getspecial.app',
          'X-Title': 'GetSpecial Restaurant Scraper',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        rawContent = json.choices?.[0]?.message?.content || '';
        usedModel = model;
        if (rawContent) break;
      } else {
        const errText = await response.text();
        console.warn(`⚠️ Modèle ${model} a retourné un statut ${response.status}: ${errText.slice(0, 150)}`);
      }
    } catch (err) {
      console.warn(`⚠️ Erreur sur le modèle ${model}:`, err.message);
    }
  }

  if (!rawContent) {
    throw new Error("Impossible de récupérer une réponse d'OpenRouter avec les modèles Claude.");
  }

  // Nettoyage éventuel des balises markdown ```json
  let cleaned = rawContent.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Tentative d'extraction par regex du premier objet JSON
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Erreur de parsing JSON de la réponse Claude : ${err.message}`);
    }
  }

  if (parsed.extractionMetadata) {
    parsed.extractionMetadata.model = usedModel;
  }

  console.log(`✅ [3/3] Extraction réussie avec succès via Claude (${usedModel}) !`);
  return parsed;
}

// Exécution directe si appelé via la ligne de commande
const isMain = process.argv[1] && process.argv[1].endsWith('extract-restaurant-maps.mjs');
if (isMain) {
  const urlArg = process.argv[2];
  if (!urlArg) {
    console.log(`
Usage:
  node scripts/extract-restaurant-maps.mjs "<LIEN_GOOGLE_MAPS>"

Exemple:
  node scripts/extract-restaurant-maps.mjs "https://maps.app.goo.gl/xyz..."
    `);
    process.exit(1);
  }

  extractRestaurantFromMaps(urlArg)
    .then((result) => {
      console.log('\n================ RÉSULTAT OBTENU (JSON) ================\n');
      console.log(JSON.stringify(result, null, 2));

      const outputPath = path.join(rootDir, 'restaurant-maps-result.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
      console.log(`\n💾 Résultat également sauvegardé dans : ${outputPath}\n`);
    })
    .catch((err) => {
      console.error('\n❌ Erreur lors de l’extraction :', err.message);
      process.exit(1);
    });
}
