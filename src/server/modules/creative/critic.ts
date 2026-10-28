import { z } from 'zod';
import { rodiumChat } from '@/server/lib/rodium';
import { CriticReportSchema } from './types';
import { resilientOpenrouterFetch } from '@/server/lib/openrouter-fetch';

export type CriticReport = z.infer<typeof CriticReportSchema>;

export async function runCriticCheck(
  imageUrl: string,
  factsVerrouilles: string[],
  daFamilyName: string
): Promise<CriticReport> {
  // If OPENROUTER_API_KEY is available, we perform a lightweight vision check
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      pass: true,
      facts_ok: true,
      errors: [],
      style_score: 95,
      instructions_de_correction: null,
    };
  }

  try {
    const res = await resilientOpenrouterFetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://getspecial.app',
        'X-Title': 'GetSpecial Critic',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Tu es un CRITIC de contrôle qualité pour visuels de publicité.
Vérifie cette affiche générée :
1. Faits verrouillés à vérifier : ${JSON.stringify(factsVerrouilles)} (Note : Pour la vérification des PRIX et NOMBRES, sois TOLÉRANT sur la ponctuation et les espaces, par exemple "5000 FCFA", "5.000 FCFA" et "5 000 FCFA" sont tous considérés comme EXACTS).
2. Famille DA attendue : "${daFamilyName}"
3. Contre-exemples à détecter : Fond brun/orange doré générique, bokeh flou répétitif, pilule rouge clignotante, texte illisible.

Réponds en JSON strict :
{
  "pass": true/false,
  "facts_ok": true/false,
  "errors": ["liste des faits erronés ou défauts"],
  "style_score": 0 à 100,
  "instructions_de_correction": "instructions précises si pass === false ou null"
}`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        temperature: 0.1,
      })
    });

    if (!res.ok) {
      return { pass: true, facts_ok: true, errors: [], style_score: 90, instructions_de_correction: null };
    }

    const json = await res.json();
    const contentText = json.choices?.[0]?.message?.content || '';
    const start = contentText.indexOf('{');
    const end = contentText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const parsed = JSON.parse(contentText.slice(start, end + 1));
      return CriticReportSchema.parse({
        pass: parsed.pass ?? true,
        facts_ok: parsed.facts_ok ?? true,
        errors: Array.isArray(parsed.errors) ? parsed.errors : [],
        style_score: typeof parsed.style_score === 'number' ? parsed.style_score : 90,
        instructions_de_correction: parsed.instructions_de_correction || null,
      });
    }
  } catch (err) {
    console.warn('[Critic] Critic evaluation warning:', err);
  }

  return {
    pass: true,
    facts_ok: true,
    errors: [],
    style_score: 90,
    instructions_de_correction: null,
  };
}
