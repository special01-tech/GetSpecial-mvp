import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { GateContext, ImageJob, InspirationRef } from "../engine";
import { RESTAURANTS } from "../golden/restaurants";
import type { PipelineDeps, ReferenceInput } from "./pipeline";
import type { ImageStore } from "./store";
import type { ImageProvider, OcrEngine } from "../provider/types";

export type DayOfWeek =
  | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DaySchedule {
  closed?: boolean;
  open?: string;   // "11:00"
  close?: string;  // "23:00"
}

export type WeeklySchedule = Partial<Record<DayOfWeek, DaySchedule>>;

/**
 * Détermine si le restaurant est fermé aujourd'hui en fonction de ses horaires
 * et de son fuseau horaire propre (ex: America/Chicago, America/New_York), JAMAIS celui du serveur.
 */
export function isClosedToday(
  schedule: WeeklySchedule,
  timezone: string,
  now: Date = new Date(),
): boolean {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" });
    const localDay = formatter.format(now).toLowerCase() as DayOfWeek;
    const dayConfig = schedule[localDay];

    if (!dayConfig || dayConfig.closed) return true;
    return false;
  } catch {
    // Si fuseau invalide, par précaution on ne bloque pas aveuglément mais on logue
    return false;
  }
}

export interface CatalogItem {
  id: string;
  filename: string;
  category: string;
  scenarios: string[];
  venueTypes: string[];
  layoutFamily: string;
  styleDescriptor: string;
  tags: string[];
  polarity: "positive" | "negative";
  similarity: number;
}

/**
 * Charge les inspirations depuis le catalogue local assets/inspirations/catalog.json.
 */
export function loadLocalInspirations(
  catalogFile = join(process.cwd(), "public", "ai-pipeline-assets", "inspirations", "catalog.json"),
): InspirationRef[] {
  if (!existsSync(/*turbopackIgnore: true*/ catalogFile)) {
    const fallbackPath = join(process.cwd(), "assets", "inspirations", "catalog.json");
    if (existsSync(/*turbopackIgnore: true*/ fallbackPath)) catalogFile = fallbackPath;
    else return [];
  }
  try {
    const data = JSON.parse(readFileSync(/*turbopackIgnore: true*/ catalogFile, "utf-8")) as { items: CatalogItem[] };
    return data.items.map((item) => ({
      id: item.id,
      ownerRestaurantId: null, // catalogue global GetSpecial
      scenarios: item.scenarios as any,
      styleDescriptor: item.styleDescriptor,
      tags: item.tags,
      rights: "licensed",
      polarity: item.polarity ?? "positive",
      similarity: item.similarity ?? 0.85,
      lastUsedAt: null,
    }));
  } catch {
    return [];
  }
}

/**
 * Charge les images de référence réelles (fichiers physiques) pour les passer au modèle d'image :
 * - Image 1 (subject_photo) : Photo de plat réel dans assets/restaurants/<restaurantId>/dish.jpg
 * - Image 2 (logo)          : Logo officiel dans assets/restaurants/<restaurantId>/logo.png
 * - Image 3 (style)         : Affiche d'inspiration choisie dans assets/inspirations/<filename>
 */
export async function loadLocalReferenceImages(
  job: ImageJob,
  chosenInspirations: InspirationRef[],
  assetsDir = join(process.cwd(), "public", "ai-pipeline-assets"),
): Promise<ReferenceInput[]> {
  const refs: ReferenceInput[] = [];
  const restoDir = join(assetsDir, "restaurants", job.restaurantId);

  // 1. Photo de plat réelle (si disponible)
  const dishCandidates = [join(restoDir, "dish.jpg"), join(restoDir, "dish.png")];
  for (const dishPath of dishCandidates) {
    if (existsSync(/*turbopackIgnore: true*/ dishPath)) {
      const mime = dishPath.endsWith(".png") ? "image/png" : "image/jpeg";
      refs.push({ role: "subject_photo", data: readFileSync(/*turbopackIgnore: true*/ dishPath), mime });
      break;
    }
  }

  // 2. Logo officiel (si disponible)
  const logoCandidates = [join(restoDir, "logo.png"), join(restoDir, "logo.jpg")];
  for (const logoPath of logoCandidates) {
    if (existsSync(/*turbopackIgnore: true*/ logoPath)) {
      const mime = logoPath.endsWith(".png") ? "image/png" : "image/jpeg";
      refs.push({ role: "logo", data: readFileSync(/*turbopackIgnore: true*/ logoPath), mime });
      break;
    }
  }

  // 3. Affiche d'inspiration (style)
  if (chosenInspirations.length > 0) {
    const catalogFile = join(assetsDir, "inspirations", "catalog.json");
    if (existsSync(/*turbopackIgnore: true*/ catalogFile)) {
      const catalog = JSON.parse(readFileSync(/*turbopackIgnore: true*/ catalogFile, "utf-8")) as { items: CatalogItem[] };
      const topChoice = chosenInspirations[0];
      const match = catalog.items.find((it) => it.id === topChoice.id);
      if (match) {
        const styleImgPath = join(assetsDir, "inspirations", match.filename);
        if (existsSync(styleImgPath)) {
          const mime = styleImgPath.endsWith(".png") ? "image/png" : "image/jpeg";
          refs.push({ role: "style", data: readFileSync(/*turbopackIgnore: true*/ styleImgPath), mime });
        }
      }
    }
  }

  return refs;
}

export interface LocalPipelineDepsOptions {
  provider: ImageProvider;
  ocr: OcrEngine;
  store: ImageStore;
  recentLayouts?: Record<string, string[]>;
  severeWeatherAlert?: boolean;
  scheduleByRestaurant?: Record<string, { schedule: WeeklySchedule; timezone: string }>;
}

/**
 * Assemble toutes les dépendances du pipeline pour une exécution 100 % locale.
 */
export function createLocalPipelineDeps(options: LocalPipelineDepsOptions): PipelineDeps {
  const recentLayoutsMap = options.recentLayouts ?? {};

  return {
    provider: options.provider,
    ocr: options.ocr,
    store: options.store,

    loadGateContext: async (job: ImageJob): Promise<GateContext> => {
      const golden =
        RESTAURANTS.find((r) => r.id === job.restaurantId) ||
        RESTAURANTS.find((r) => r.name.toLowerCase() === (job.restaurantName || '').toLowerCase()) ||
        RESTAURANTS[0];
      const schedInfo = options.scheduleByRestaurant?.[job.restaurantId];

      let closedToday = false;
      if (schedInfo) {
        closedToday = isClosedToday(schedInfo.schedule, schedInfo.timezone);
      }

      return {
        severeWeatherAlert: options.severeWeatherAlert ?? false,
        venue: {
          type: golden?.venue.type ?? "family_restaurant",
          hasPatio: golden?.venue.hasPatio ?? true,
          closedToday,
          enabledThemes: golden?.venue.enabledThemes ?? ["weather", "holiday", "concert", "sport"],
          blockedTopics: golden?.venue.blockedTopics ?? [],
        },
      };
    },

    loadInspirations: async (_job: ImageJob): Promise<InspirationRef[]> => {
      return loadLocalInspirations();
    },

    loadRecentLayouts: async (restaurantId: string): Promise<string[]> => {
      return recentLayoutsMap[restaurantId] ?? [];
    },

    loadReferenceImages: async (job: ImageJob, chosen: InspirationRef[]): Promise<ReferenceInput[]> => {
      return loadLocalReferenceImages(job, chosen);
    },
  };
}
