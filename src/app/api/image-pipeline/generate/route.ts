import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { prisma } from '@/server/db/prisma.client';
import { success, error } from '@/server/lib/api-response';
import { z } from 'zod';
import { checkRateLimit } from '@/server/lib/rate-limit';
import { RESTAURANTS, GoldenRestaurant } from '@/server/modules/image-pipeline/golden/restaurants';
import {
  ImageJob,
  Scenario,
  ImageFormat,
  BrandDNA,
  selectInspirations,
} from '@/server/modules/image-pipeline/engine';
import { createLocalPipelineDeps, loadLocalInspirations } from '@/server/modules/image-pipeline/pipeline/localDeps';
import { LocalImageStore } from '@/server/modules/image-pipeline/pipeline/localStore';
import { runImagePipeline } from '@/server/modules/image-pipeline/pipeline/pipeline';
import { OpenRouterVisionOcr } from '@/server/modules/image-pipeline/provider/ocr';
import { OpenRouterImagesProvider } from '@/server/modules/image-pipeline/provider/openrouterImages';
import { ImageProvider, OcrEngine } from '@/server/modules/image-pipeline/provider/types';

export const dynamic = 'force-dynamic';

const store = new LocalImageStore();

const GeneratePosterSchema = z.object({
  restaurantId: z.string().optional(),
  campaignId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional().default(''),
  discountValue: z.string().optional(),
  scenario: z
    .enum([
      'rain_evening',
      'rain_now',
      'heat',
      'cold',
      'patio',
      'game_night',
      'concert',
      'holiday',
      'daily_special',
      'special_hours',
    ])
    .optional(),
  format: z.enum(['square_1080', 'portrait_4x5', 'landscape_4x3']).default('square_1080'),
  channel: z.enum(['instagram', 'facebook', 'google']).default('instagram'),
  severeWeatherAlert: z.boolean().optional().default(false),
});

/**
 * Infère le scénario de la DA d'après le texte, l'offre ou l'événement
 */
function inferScenario(title: string, desc: string): Scenario {
  const t = `${title} ${desc}`.toLowerCase();
  if (t.includes('pluie') || t.includes('rain') || t.includes('orage')) return 'rain_evening';
  if (t.includes('soleil') || t.includes('terrasse') || t.includes('patio') || t.includes('apero')) return 'patio';
  if (t.includes('chaleur') || t.includes('frais') || t.includes('glace')) return 'heat';
  if (t.includes('hiver') || t.includes('froid') || t.includes('soupe') || t.includes('raclette')) return 'cold';
  if (t.includes('match') || t.includes('foot') || t.includes('sport') || t.includes('psg')) return 'game_night';
  if (t.includes('concert') || t.includes('live') || t.includes('musique') || t.includes('dj')) return 'concert';
  if (t.includes('fête') || t.includes('noel') || t.includes('halloween') || t.includes('valentin') || t.includes('férié')) return 'holiday';
  if (t.includes('horaire') || t.includes('ouverture') || t.includes('fermeture')) return 'special_hours';
  return 'daily_special';
}

/**
 * Récupère ou fabrique le BrandDNA du restaurant
 */
function resolveBrandDNA(restaurant: any): BrandDNA {
  const golden = RESTAURANTS.find((r) => r.id === restaurant.id);
  if (golden) return golden.brand;

  return {
    restaurantId: restaurant.id,
    version: 1,
    palette: ['#1F2937', '#D97706', '#F3F4F6'],
    typographyStyle: 'bold modern sans-serif, high contrast',
    moodKeywords: ['gourmet', 'friendly', 'authentic', 'bistro'],
    photoStyle: 'natural warm lighting, appetizing fresh close-ups',
    layoutFamilies: ['poster_bold', 'magazine', 'photo_full'],
    doList: ['show fresh ingredients and appetizing food'],
    dontList: ['no distorted text or extra slogans'],
    seed: 42000,
  };
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, 'image-pipeline:generate', 10, 60 * 1000);
    if (!rate.allowed) {
      return error(`Limite atteinte. Réessayez dans ${rate.retryAfterSec}s.`, 429);
    }
    const body = await req.json();
    const validated = GeneratePosterSchema.safeParse(body);

    if (!validated.success) {
      return error(validated.error.issues[0]?.message ?? 'Paramètres invalides', 400);
    }

    const {
      restaurantId: reqRestId,
      campaignId,
      title,
      description,
      discountValue,
      format,
      channel,
      severeWeatherAlert,
    } = validated.data;

    // 1. Trouver le restaurant
    let restaurant = null;
    if (reqRestId) {
      try {
        restaurant = await (prisma as any).restaurant.findUnique({
          where: { id: reqRestId },
          include: { profile: true },
        });
      } catch {}
    }

    if (!restaurant) {
      restaurant = await (prisma as any).restaurant.findFirst({
        where: { status: 'active' },
        include: { profile: true },
      });
    }

    const restId = restaurant?.id || 'rest_paris_atelier_1';
    const restName = restaurant?.name || "L'Atelier Culinaire";

    // 2. Déduire le scénario
    const scenario = validated.data.scenario || inferScenario(title, description);

    // 3. Préparer les Facts stricts (règle : le LLM/modèle n'invente rien)
    const facts = [{ key: 'headline', value: title }];
    if (discountValue) {
      facts.push({ key: 'offer', value: discountValue });
    }

    const brand = resolveBrandDNA({ id: restId, name: restName });

    const job: ImageJob = {
      jobId: `job-${Date.now()}`,
      restaurantId: restId,
      campaignId: campaignId || `camp-${Date.now()}`,
      scenario,
      format,
      channel,
      facts,
      brand,
      restaurantName: restName,
    };

    // 4. Configuration Fournisseur (OpenRouter ou Fallback Haute Définition)
    const apiKey = process.env.OPENROUTER_API_KEY;
    const hasKey = Boolean(apiKey && apiKey.startsWith('sk-or-'));

    let provider: ImageProvider;
    let ocr: OcrEngine;

    if (hasKey) {
      provider = new OpenRouterImagesProvider({
        apiKey: apiKey!,
        model: process.env.IMAGE_MODEL || 'openai/gpt-image-2',
      });
      ocr = new OpenRouterVisionOcr({
        apiKey: apiKey!,
        model: process.env.OCR_MODEL || 'anthropic/claude-3.5-haiku',
      });
    } else {
      // Fournisseur local déterministe avec sélection de la meilleure inspiration de la DA GetSpecial
      provider = {
        name: 'getspecial-da-pipeline',
        generate: async (reqGen) => {
          // Sélectionner la meilleure référence du catalogue selon le scénario
          const inspirations = loadLocalInspirations();
          const chosen = selectInspirations(job, inspirations);
          const top = chosen.positives[0];

          let relativePath = 'happy_hour/hh-01.jpg';
          if (top) {
            const filename = (top as any).filename || (top.id.startsWith('hh') ? `happy_hour/${top.id}.jpg` : `${top.id}.jpg`);
            relativePath = filename;
          }

          const localFilePath = join(process.cwd(), 'public', 'ai-pipeline-assets', 'inspirations', relativePath);
          let buffer = Buffer.from([]);
          if (existsSync(localFilePath)) {
            try {
              buffer = readFileSync(localFilePath);
            } catch (readErr) {
              console.warn('[IMAGE_PIPELINE_FALLBACK_READ_ERROR]', readErr);
            }
          }

          return {
            data: buffer,
            mime: 'image/jpeg',
            model: 'getspecial-da-engine',
            costUsd: 0,
            latencyMs: 120,
          };
        },
      };

      ocr = {
        read: async () => title,
      };
    }

    const deps = createLocalPipelineDeps({
      provider,
      ocr,
      store,
      severeWeatherAlert,
    });

    deps.config = {
      skipOcr: !hasKey, // Vérification OCR active uniquement avec vraie clé OpenRouter
    };

    const outcome = await runImagePipeline(job, deps);

    // Récupération des inspirations pour l'UI
    const catalogInspirations = await deps.loadInspirations(job);
    const selectedRefs = selectInspirations(job, catalogInspirations);

    return success({
      jobId: job.jobId,
      scenario,
      status: outcome.status,
      result: outcome.status === 'done' ? outcome.result : null,
      reasons: outcome.status === 'blocked' ? outcome.reasons : null,
      brand: {
        palette: brand.palette,
        typographyStyle: brand.typographyStyle,
        moodKeywords: brand.moodKeywords,
      },
      inspirationsUsed: selectedRefs.positives.map((p) => ({
        id: p.id,
        style: p.styleDescriptor,
        tags: p.tags,
      })),
    });
  } catch (err: any) {
    return error(err.message, 500);
  }
}
