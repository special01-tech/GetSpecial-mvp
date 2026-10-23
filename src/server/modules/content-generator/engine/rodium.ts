const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export const TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || 'anthropic/claude-3.5-sonnet';
export const STRATEGIST_MODEL = process.env.OPENROUTER_REASONING_MODEL || 'openai/gpt-4o-mini';

/**
 * Extraction défensive et résiliente du premier objet JSON valide dans une réponse textuelle
 */
export function extractJson<T = any>(text: string): T | null {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Continuer
  }

  // 2. Supprimer les balises de blocs Markdown (```json ... ```)
  let cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // Si le modèle a directement commencé par les clés sans l'accolade ouvrante {
  if (!cleaned.startsWith('{')) {
    const firstKeyIndex = cleaned.search(/"[a-zA-Z0-9_-]+"\s*:/);
    if (firstKeyIndex !== -1) {
      cleaned = '{' + cleaned.slice(firstKeyIndex);
    }
  }

  // Si le modèle n'a pas inclus l'accolade fermante à la fin
  if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
    cleaned = cleaned + '\n}';
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Continuer
  }

  // 3. Extraire entre la première accolade ouvrante et la dernière fermante
  let start = cleaned.indexOf('{');
  let end = cleaned.lastIndexOf('}');

  if (start === -1) {
    const firstKey = cleaned.search(/"[a-zA-Z0-9_-]+"\s*:/);
    if (firstKey !== -1) {
      cleaned = '{' + cleaned.slice(firstKey);
      start = 0;
      end = cleaned.lastIndexOf('}');
    }
  }

  if (start !== -1 && (end === -1 || end <= start)) {
    cleaned = cleaned + '\n}';
    end = cleaned.lastIndexOf('}');
  }

  if (start === -1 || end === -1 || end <= start) return null;

  let slice = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(slice) as T;
  } catch {
    // Continuer vers la réparation de syntaxe
  }

  try {
    // Supprimer les commentaires JS inline // ...
    slice = slice.replace(/\/\/[^\n\r]*/g, '');
    // Supprimer les commentaires blocs /* ... */
    slice = slice.replace(/\/\*[\s\S]*?\*\//g, '');
    // Supprimer les trailing commas (virgule avant ] ou })
    slice = slice.replace(/,(\s*[}\]])/g, '$1');

    return JSON.parse(slice) as T;
  } catch {
    return null;
  }
}

/**
 * Appel Chat Completion OpenRouter avec garantie de JSON strict et retry automatique
 */
export async function rodiumChat<T = any>(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    retry?: boolean;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}
): Promise<T> {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY non configurée.');
  }

  const {
    retry = true,
    maxTokens = 2500,
    temperature = 0.5,
    model = TEXT_MODEL,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://getspecial.app',
        'X-Title': 'GetSpecial Engine',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Math.max(maxTokens, 3500),
        temperature,
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      const err = new Error(`OpenRouter chat ${res.status}: ${bodyText.slice(0, 500)}`);
      (err as any).status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson<T>(content);

    if (parsed) return parsed;

    console.warn(`[RODIUM_PARSE_WARN] Parsing JSON échoué pour le modèle "${model}". Extrait brut :`, content.slice(0, 300));

    if (retry) {
      return rodiumChat<T>(
        [
          ...messages,
          {
            role: 'user',
            content: 'Erreur: Réponds STRICTEMENT avec l’objet JSON pur valide sans AUCUN texte d’introduction ni balise markdown.',
          },
        ],
        { retry: false, maxTokens: Math.max(maxTokens, 3000), temperature: 0.2, model }
      );
    }

    throw new Error('Le modèle IA n’a pas renvoyé de JSON valide.');
  } finally {
    clearTimeout(timeoutId);
  }
}
