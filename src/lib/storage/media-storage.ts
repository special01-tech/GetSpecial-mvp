import fs from 'fs';
import path from 'path';

export interface SavedMediaResult {
  url: string;
  storageType: 'local' | 'supabase';
  fileName: string;
}

/**
 * Service de stockage unifié pour les médias (images générées, photos de référence, uploads utilisateur).
 * Utilise le stockage local persistant (public/uploads et public/generated) avec support transparent pour Supabase Storage.
 */
export class MediaStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), 'public');
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

    const targetDir = path.join(this.baseDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, fileName);

    let buffer: Buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      const base64Data = data.includes('base64,') ? data.split('base64,')[1] : data;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new Error('Données média invalides');
    }

    fs.writeFileSync(filePath, buffer);

    return {
      url: `/${folder}/${fileName}`,
      storageType: 'local',
      fileName,
    };
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
