import { generatePostImage } from '@/server/modules/content-generator/engine/openrouter-image';
import { AspectRatio } from '@/server/modules/content-generator/engine/types';

export interface GenerateImageOptions {
  aspectRatio?: string;
  inputReferences?: string[];
  referenceImages?: string[];
  logoUrl?: string | null;
  restaurantName?: string;
}

export interface GenerateImageResult {
  url: string;
  buffer: Buffer;
  mimeType: string;
  referenceImagesDropped?: boolean;
}

/**
 * Passerelle d'exécution de génération visuelle pour le pipeline créatif
 */
export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<GenerateImageResult> {
  const rawRatio = options.aspectRatio || '4:5';
  const aspectRatio: AspectRatio = ['4:5', '9:16', '1:1', '16:9'].includes(rawRatio)
    ? (rawRatio as AspectRatio)
    : '4:5';

  const refs = options.inputReferences || options.referenceImages || [];

  const res = await generatePostImage(prompt, {
    aspectRatio,
    referenceImages: refs,
    logoUrl: options.logoUrl,
    restaurantName: options.restaurantName,
  });

  let buffer = Buffer.from([]);
  let mimeType = 'image/png';

  if (res.imageUrl.startsWith('data:')) {
    const parts = res.imageUrl.split(',');
    const match = res.imageUrl.match(/data:([^;]+);/);
    if (match) mimeType = match[1];
    if (parts.length > 1) {
      buffer = Buffer.from(parts[1], 'base64');
    }
  } else if (res.imageUrl.startsWith('http://') || res.imageUrl.startsWith('https://')) {
    try {
      const fetchRes = await fetch(res.imageUrl);
      if (fetchRes.ok) {
        mimeType = fetchRes.headers.get('content-type') || 'image/png';
        buffer = Buffer.from(await fetchRes.arrayBuffer());
      }
    } catch (err) {
      console.warn('[generateImage] Failed to buffer remote image URL:', err);
    }
  }

  return {
    url: res.imageUrl,
    buffer,
    mimeType,
    referenceImagesDropped: res.referenceImagesDropped,
  };
}
