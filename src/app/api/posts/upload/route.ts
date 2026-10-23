import { NextRequest } from 'next/server';
import { success, error } from '@/server/lib/api-response';
import { mediaStorage } from '@/lib/storage/media-storage';
import { contentGeneratorService } from '@/server/modules/content-generator/content-generator.service';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // CAS 1 : FormData (fichiers natifs uploadés depuis le navigateur)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const restaurantId = formData.get('restaurantId') as string;
      const caption = (formData.get('caption') as string) || '';
      const platform = (formData.get('platform') as string) || 'instagram';
      const scheduledAtStr = formData.get('scheduledAt') as string;
      const aspectRatio = (formData.get('aspectRatio') as any) || '4:5';

      if (!restaurantId) {
        return error('restaurantId est requis', 400);
      }

      const files = formData.getAll('files') as File[];
      if (!files || files.length === 0) {
        return error('Au moins un fichier image ou vidéo est requis', 400);
      }

      const mediaUrls: string[] = [];
      let isVideo = false;

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mime = file.type || 'image/jpeg';
        if (mime.startsWith('video/')) isVideo = true;

        const saved = await mediaStorage.saveMedia(
          buffer,
          'user-uploads',
          `upload_${restaurantId}`,
          mime
        );
        mediaUrls.push(saved.url);
      }

      const mediaType = isVideo ? 'video' : mediaUrls.length > 1 ? 'carousel' : 'image';
      const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : undefined;

      const post = await contentGeneratorService.createDirectUploadPost({
        restaurantId,
        caption,
        mediaUrls,
        mediaType,
        aspectRatio,
        platform,
        scheduledAt,
      });

      return success(post, 201);
    }

    // CAS 2 : JSON
    const body = await req.json();
    const { restaurantId, caption, mediaUrls, mediaType, platform, scheduledAt, aspectRatio } = body;

    if (!restaurantId || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      return error('restaurantId et mediaUrls sont requis', 400);
    }

    const post = await contentGeneratorService.createDirectUploadPost({
      restaurantId,
      caption: caption || '',
      mediaUrls,
      mediaType: mediaType || (mediaUrls.length > 1 ? 'carousel' : 'image'),
      aspectRatio: aspectRatio || '4:5',
      platform: platform || 'instagram',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    return success(post, 201);
  } catch (err: any) {
    console.error('[API_POSTS_UPLOAD_ERROR]', err);
    return error(err.message || 'Erreur lors de l’upload du post', 500);
  }
}
