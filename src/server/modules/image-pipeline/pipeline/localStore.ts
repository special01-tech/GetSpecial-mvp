import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ImageResult } from "../engine";
import type { ImageStore } from "./store";

export interface DailyUsageRecord {
  date: string;          // YYYY-MM-DD
  count: number;
  costUsd: number;
}

export interface QuotaConfig {
  maxDailyImages: number;
  maxDailyCostUsd: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  currentCount: number;
  currentCostUsd: number;
  reason?: string;
}

/**
 * Adaptateur de stockage local :
 * - Sauvegarde physique des images sur le disque (outputs/images/)
 * - Idempotence stricte via outputs/results.json
 * - Suivi d'utilisation et de quotas via outputs/usage.json
 */
export class LocalImageStore implements ImageStore {
  private readonly resultsFile: string;
  private readonly usageFile: string;
  private readonly imagesDir: string;

  constructor(private readonly baseDir?: string) {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const root = isServerless ? '/tmp' : process.cwd();
    this.imagesDir = this.baseDir || (isServerless ? join('/tmp', 'generated-posters') : join(process.cwd(), "public", "generated-posters"));
    this.resultsFile = join(root, "outputs", "results.json");
    this.usageFile = join(root, "outputs", "usage.json");
    this.ensureDirs();
  }

  private ensureDirs() {
    try {
      if (!existsSync(this.imagesDir)) mkdirSync(this.imagesDir, { recursive: true });
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const root = isServerless ? '/tmp' : process.cwd();
      const outDir = join(root, "outputs");
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      if (!existsSync(this.resultsFile)) writeFileSync(this.resultsFile, "{}", "utf-8");
      if (!existsSync(this.usageFile)) writeFileSync(this.usageFile, "{}", "utf-8");
    } catch (err) {
      console.warn('[LOCAL_IMAGE_STORE] Warning: Could not initialize directories:', err);
    }
  }

  private readJson<T>(file: string, fallback: T): T {
    try {
      if (!existsSync(file)) return fallback;
      return JSON.parse(readFileSync(file, "utf-8")) as T;
    } catch {
      return fallback;
    }
  }

  private writeJson(file: string, data: unknown) {
    try {
      const dir = dirname(file);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.warn('[LOCAL_IMAGE_STORE] Warning: Could not write JSON:', err);
    }
  }

  async getResult(key: string): Promise<ImageResult | null> {
    const results = this.readJson<Record<string, ImageResult>>(this.resultsFile, {});
    return results[key] ?? null;
  }

  async putResult(key: string, result: ImageResult): Promise<void> {
    const results = this.readJson<Record<string, ImageResult>>(this.resultsFile, {});
    results[key] = result;
    this.writeJson(this.resultsFile, results);
  }

  async saveImage(key: string, data: Buffer, mime: string): Promise<string> {
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const safeKey = key.replace(/[/\\?%*:|"<>]/g, "_");
    const filename = `${safeKey}.${ext}`;
    const targetPath = join(/*turbopackIgnore: true*/ this.imagesDir, filename);

    try {
      writeFileSync(targetPath, data);
    } catch (err) {
      console.warn('[LOCAL_IMAGE_STORE] Warning: Could not save image to disk:', err);
    }
    return `/generated-posters/${filename}`;
  }

  /**
   * Enregistre l'utilisation (coût et image) pour un restaurant à une date donnée (YYYY-MM-DD).
   */
  async recordUsage(restaurantId: string, costUsd: number, dateStr?: string): Promise<DailyUsageRecord> {
    const today = dateStr ?? new Date().toISOString().slice(0, 10);
    const usage = this.readJson<Record<string, Record<string, DailyUsageRecord>>>(this.usageFile, {});

    if (!usage[today]) usage[today] = {};
    const current = usage[today][restaurantId] ?? { date: today, count: 0, costUsd: 0 };

    current.count += 1;
    current.costUsd = Number((current.costUsd + costUsd).toFixed(4));
    usage[today][restaurantId] = current;

    this.writeJson(this.usageFile, usage);
    return current;
  }

  /**
   * Vérifie si le restaurant a dépassé son quota quotidien de coût ou de volume.
   */
  async checkQuota(
    restaurantId: string,
    config: QuotaConfig = { maxDailyImages: 10, maxDailyCostUsd: 2.0 },
    dateStr?: string,
  ): Promise<QuotaCheckResult> {
    const today = dateStr ?? new Date().toISOString().slice(0, 10);
    const usage = this.readJson<Record<string, Record<string, DailyUsageRecord>>>(this.usageFile, {});
    const current = usage[today]?.[restaurantId] ?? { date: today, count: 0, costUsd: 0 };

    if (current.count >= config.maxDailyImages) {
      return {
        allowed: false,
        currentCount: current.count,
        currentCostUsd: current.costUsd,
        reason: `Quota journalier atteint (${current.count}/${config.maxDailyImages} images)`,
      };
    }

    if (current.costUsd >= config.maxDailyCostUsd) {
      return {
        allowed: false,
        currentCount: current.count,
        currentCostUsd: current.costUsd,
        reason: `Plafond de coût journalier atteint (${current.costUsd.toFixed(2)}$ / ${config.maxDailyCostUsd.toFixed(2)}$)`,
      };
    }

    return {
      allowed: true,
      currentCount: current.count,
      currentCostUsd: current.costUsd,
    };
  }
}
