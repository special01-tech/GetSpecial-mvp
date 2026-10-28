import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, supabase } from '@/server/db/supabase.client';

export interface SavedMediaResult {
  url: string;
  storageType: 'local' | 'supabase';
  fileName: string;
}

/**
 * Service de stockage unifié pour les médias (images générées, photos de référence, uploads utilisateur).
 * Héberge en priorité sur Supabase Storage avec URL HTTPS publique (requis par Meta Graph API pour Instagram/Facebook),
 * avec repli sécurisé sur disque local / base64 si hors-ligne ou dev local.
 */
export class MediaStorageService {
  private baseDir: string;
  private bucketName: string;
  private bucketChecked: boolean = false;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public');
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'getspecial-media';
  }

  private async ensureBucketExists(client: any): Promise<void> {
    if (this.bucketChecked) return;
    try {
      const { data: buckets } = await client.storage.listBuckets();
      const exists = Array.isArray(buckets) && buckets.some((b: any) => b.name === this.bucketName);
      if (!exists && client.storage.createBucket) {
        await client.storage.createBucket(this.bucketName, { public: true });
      }
      this.bucketChecked = true;
    } catch {
      this.bucketChecked = true;
    }
  }

  /**
   * Sauvegarde un buffer ou une chaîne Base64 en fichier image ou vidéo
   */
  async saveMedia(
    data: Buffer | string,
    folder: 'generated' | 'reference-images' | 'user-uploads',
    fileNameWithoutExt: string,
    mimeType: string = 'image/png'
  ): Promise<SavedMediaResult> {
    const ext = this.getExtensionFromMime(mimeType);
    const cleanName = fileNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const fileName = `${cleanName}-${Date.now()}.${ext}`;

    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      const base64Data = data.includes('base64,') ? data.split('base64,')[1] : data;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('Données média invalides');
    }

    // 1. Priorité 1 : Supabase Storage (Production Vercel & Meta Graph API compatible)
    try {
      let client: any = null;
      try {
        client = getSupabaseAdmin();
      } catch {
        client = supabase;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (client && supabaseUrl && !supabaseUrl.includes('localhost:54321')) {
        await this.ensureBucketExists(client);

        const storagePath = `${folder}/${fileName}`;
        const { error: uploadError } = await client.storage
          .from(this.bucketName)
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = client.storage
            .from(this.bucketName)
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            return {
              url: publicUrlData.publicUrl,
              storageType: 'supabase',
              fileName,
            };
          }
        } else {
          console.warn('[MEDIA_STORAGE] Erreur upload Supabase Storage :', uploadError.message);
        }
      }
    } catch (err: any) {
      console.warn('[MEDIA_STORAGE] Supabase Storage non joignable :', err?.message);
    }

    // 2. Repli local (Environnement de dev local ou sans réseau)
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    try {
      const targetDir = isServerless ? path.join('/tmp', folder) : path.join(this.baseDir, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const filePath = path.join(targetDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return {
        url: isServerless ? `data:${mimeType};base64,${buffer.toString('base64')}` : `/${folder}/${fileName}`,
        storageType: 'local',
        fileName,
      };
    } catch (err) {
      console.warn('[MEDIA_STORAGE] Could not write to local disk, returning base64 data URI:', err);
      return {
        url: `data:${mimeType};base64,${buffer.toString('base64')}`,
        storageType: 'local',
        fileName,
      };
    }
  }

  private getExtensionFromMime(mime: string): string {
    const m = (mime || '').toLowerCase();
    if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
    if (m.includes('png')) return 'png';
    if (m.includes('webp')) return 'webp';
    if (m.includes('mp4')) return 'mp4';
    if (m.includes('mov') || m.includes('quicktime')) return 'mov';
    if (m.includes('webm')) return 'webm';
    return 'jpg';
  }
}

export const mediaStorage = new MediaStorageService();

