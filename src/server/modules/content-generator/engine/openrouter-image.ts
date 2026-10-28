import fs from 'fs';
import path from 'path';
import { mediaStorage } from '@/lib/storage/media-storage';
import { AspectRatio } from './types';
import { resilientOpenrouterFetch } from '@/server/lib/openrouter-fetch';

const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_IMAGE_MODEL = process.env.IMAGE_MODEL || process.env.OPENROUTER_IMAGE_MODEL || 'openai/gpt-image-2';
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function mapAspectRatioToSize(aspectRatio: AspectRatio = '4:5'): string {
  switch (aspectRatio) {
    case '9:16':
      return '1024x1792';
    case '4:5':
      return '1024x1280';
    case '16:9':
      return '1792x1008';
    case '1:1':
    default:
      return '1024x1024';
  }
}

export function mapAspectRatioToOpenRouterParam(aspectRatio: AspectRatio = '4:5'): string {
  switch (aspectRatio) {
    case '9:16':
      return '9:16';
    case '4:5':
      return '3:4'; // Ratio portrait vertical officiel accepté par l'endpoint (OpenAI)
    case '16:9':
      return '16:9';
    case '1:1':
    default:
      return '1:1';
  }
}

/**
 * Résout toute référence (Data URI, URL http(s) ou fichier local dans /public) en Data URI Base64
 * afin qu'OpenRouter puisse l'exploiter même en environnement local.
 */
async function resolveReferencesToBase64(refs: string[]): Promise<string[]> {
  const resolved: string[] = [];
  const toDataUri = (buf: Buffer, mime: string) => `data:${mime};base64,${buf.toString('base64')}`;

  for (const raw of refs) {
    if (!raw) continue;
    const ref = String(raw).trim();
    if (!ref) continue;

    if (ref.startsWith('data:image/')) {
      resolved.push(ref);
      continue;
    }

    if (ref.startsWith('http://') || ref.startsWith('https://')) {
      try {
        const res = await fetch(ref);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          resolved.push(toDataUri(buf, res.headers.get('content-type') || 'image/png'));
        }
      } catch (err: any) {
        console.warn('[openrouterImage] Impossible de récupérer la référence distante:', err?.message);
      }
      continue;
    }

    // Chemin local relatif à /public
    const cleanRel = ref.replace(/^\/+/, '');
    const localPath = path.join(process.cwd(), 'public', cleanRel);
    if (fs.existsSync(localPath)) {
      try {
        const buf = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        resolved.push(toDataUri(buf, mime));
      } catch (err: any) {
        console.warn('[openrouterImage] Impossible de lire la référence locale:', err?.message);
      }
    }
  }

  return resolved;
}

function enforceCreativeOrientations(prompt: string): string {
  let enhanced = prompt.trim();

  const hasNeutralLight = /5000|5600|neutral.*daylight|white balance/i.test(enhanced);
  const hasAntiCgi = /natural imperfections|no plastic|no cgi|pores/i.test(enhanced);
  const hasAntiAmber = /no orange.*cast|no amber|no tungsten|forbid.*amber/i.test(enhanced);

  const additions: string[] = [];
  if (!hasNeutralLight || !hasAntiAmber) {
    additions.push(
      '- Lighting: Soft neutral natural daylight (5000-5600K), neutral white balance with pure clean whites. Strict prohibition of orange, amber, golden or yellow color cast, and no warm tungsten glow.'
    );
  }
  if (!hasAntiCgi) {
    additions.push(
      '- Authentic food photography: Real food photograph with natural textures, visible pores, and appetizing imperfections. Zero plastic gloss, zero 3D CGI render sheen, zero artificial saturation. The dish is intact and whole.'
    );
  }
  if (!/avoid/i.test(enhanced)) {
    additions.push(
      '- Counter-example to avoid: Generic brown/orange golden background, repetitive blurry bokeh, red price bubbles, yellow cast on the food, and heavy full-width bottom banners.'
    );
  }

  if (additions.length > 0) {
    enhanced = `${enhanced}\n\n[CREATIVE ORIENTATIONS & REALISM DIRECTIVES]\n${additions.join('\n')}`;
  }

  return enhanced;
}

export async function generatePostImage(
  prompt: string,
  options: {
    aspectRatio?: AspectRatio;
    referenceImages?: string[];
    logoUrl?: string | null;
    restaurantName?: string;
  } = {}
): Promise<{ imageUrl: string; referenceImagesDropped: boolean }> {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY non configurée.');
  }

  const finalPrompt = enforceCreativeOrientations(prompt);

  const aspectRatio = options.aspectRatio || '4:5';
  const size = mapAspectRatioToSize(aspectRatio);
  const openRouterAspectRatio = mapAspectRatioToOpenRouterParam(aspectRatio);

  const rawRefs = [
    ...(options.referenceImages || []),
    ...(options.logoUrl ? [options.logoUrl] : []),
  ];
  const base64Refs = await resolveReferencesToBase64(rawRefs);

  let inputReferences: string[] | null = base64Refs.length > 0 ? base64Refs : null;
  let referenceImagesDropped = false;
  let includeAspectRatioParam = true;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const body: Record<string, any> = {
        model: OPENROUTER_IMAGE_MODEL,
        prompt: finalPrompt,
      };

      if (includeAspectRatioParam && openRouterAspectRatio) {
        body.aspect_ratio = openRouterAspectRatio;
      } else {
        body.size = size;
      }

      if (inputReferences && inputReferences.length > 0) {
        body.input_references = inputReferences.map((url) => ({
          type: 'image_url',
          image_url: { url },
        }));
        body.images = inputReferences;
        body.image = inputReferences[0];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      let res = await resilientOpenrouterFetch(`${OPENROUTER_BASE}/images`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://getspecial.dev',
          'X-Title': 'GetSpecial Image Pipeline',
        },
        body: JSON.stringify(body),
      }).finally(() => clearTimeout(timeoutId));

      // Fallback sur /chat/completions uniquement si le modèle ne supporte pas /images (404/405)
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        const chatBody: Record<string, any> = {
          model: OPENROUTER_IMAGE_MODEL,
          messages: [{ role: 'user', content: prompt }],
          modalities: ['image', 'text'],
          stream: false,
        };
        res = await resilientOpenrouterFetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://getspecial.dev',
            'X-Title': 'GetSpecial Image Pipeline',
          },
          body: JSON.stringify(chatBody),
        });
      }

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        console.warn(`[openrouterImage] HTTP ${res.status}:`, bodyText);

        if (res.status === 400 || res.status === 422) {
          if (includeAspectRatioParam && (bodyText.includes('aspect_ratio') || bodyText.includes('image_config'))) {
            includeAspectRatioParam = false;
            continue;
          }
          if (inputReferences && inputReferences.length > 0) {
            inputReferences = null;
            referenceImagesDropped = true;
            continue;
          }
        }

        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
          continue;
        }

        throw new Error(`Échec OpenRouter Image (${res.status}): ${bodyText.slice(0, 200)}`);
      }

      const data = await res.json();

      // Extraction résiliente de l'image (chat.completions message.images ou data[0])
      const msgImage = data?.choices?.[0]?.message?.images?.[0];
      const directImage = data?.data?.[0];
      const imageUrlCandidate: string | undefined =
        msgImage?.image_url?.url ||
        msgImage?.imageUrl?.url ||
        (typeof msgImage === 'string' ? msgImage : undefined) ||
        directImage?.url ||
        directImage?.b64_json;

      if (!imageUrlCandidate) {
        throw new Error('Aucune image reçue du service de génération OpenRouter.');
      }

      let finalUrl = '';
      if (imageUrlCandidate.startsWith('data:image/') || (!imageUrlCandidate.startsWith('http://') && !imageUrlCandidate.startsWith('https://'))) {
        const cleanB64 = imageUrlCandidate.replace(/^data:image\/[a-z]+;base64,/, '');
        const saved = await mediaStorage.saveMedia(
          cleanB64,
          'generated',
          `post_${(options.restaurantName || 'resto').replace(/[^a-zA-Z0-9]/g, '_')}`,
          'image/png'
        );
        finalUrl = saved.url;
      } else {
        // URL http(s) distante : la sauvegarder localement pour disponibilité pérenne
        try {
          const downloadRes = await fetch(imageUrlCandidate);
          if (downloadRes.ok) {
            const buf = Buffer.from(await downloadRes.arrayBuffer());
            const mime = downloadRes.headers.get('content-type') || 'image/png';
            const saved = await mediaStorage.saveMedia(
              buf.toString('base64'),
              'generated',
              `post_${(options.restaurantName || 'resto').replace(/[^a-zA-Z0-9]/g, '_')}`,
              mime
            );
            finalUrl = saved.url;
          } else {
            finalUrl = imageUrlCandidate;
          }
        } catch {
          finalUrl = imageUrlCandidate;
        }
      }

      return {
        imageUrl: finalUrl,
        referenceImagesDropped,
      };
    } catch (err: any) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    }
  }

  throw new Error('Génération d’image échouée après tentatives.');
}
