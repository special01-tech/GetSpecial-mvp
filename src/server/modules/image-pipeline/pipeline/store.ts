import type { ImageResult } from "../engine";

/** Stockage des images + résultats. En prod : Supabase Storage (chemin restaurant_id/…) + table. */
export interface ImageStore {
  getResult(key: string): Promise<ImageResult | null>;
  putResult(key: string, result: ImageResult): Promise<void>;
  saveImage(key: string, data: Buffer, mime: string): Promise<string>; // retourne l'URL
}

export class InMemoryImageStore implements ImageStore {
  results = new Map<string, ImageResult>();
  images = new Map<string, { data: Buffer; mime: string }>();
  async getResult(key: string) { return this.results.get(key) ?? null; }
  async putResult(key: string, r: ImageResult) { this.results.set(key, r); }
  async saveImage(key: string, data: Buffer, mime: string) {
    this.images.set(key, { data, mime });
    return `memory://${key}`;
  }
}
