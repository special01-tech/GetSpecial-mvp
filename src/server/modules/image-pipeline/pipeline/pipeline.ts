import {
  buildPrompt, checkImageText, imageGate, pickLayoutFamily, selectInspirations,
  type GateContext, type GateReason, type ImageJob, type ImageResult, type InspirationRef, type ReferenceRole,
} from "../engine";
import { withRetry } from "../provider/retry";
import { ProviderError, type ImageProvider, type OcrEngine } from "../provider/types";
import type { ImageStore } from "./store";

export interface ReferenceInput { role: ReferenceRole; data: Buffer; mime: string }

export interface PipelineConfig {
  maxReferences: number;      // images envoyées au modèle (coût + risque de copie), défaut 3
  maxAttempts: number;        // générations avec texte (défaut 2), avant le secours sans texte
  maxCostUsd: number;         // plafond de coût par job
  providerRetries: number;    // retries sur erreurs transitoires (429, 5xx, timeout)
  retryBaseMs: number;
  sleep?: (ms: number) => Promise<void>;
  skipOcr?: boolean;          // désactive l'OCR et accepte directement l'image
}

export const DEFAULT_CONFIG: PipelineConfig = { maxReferences: 3, maxAttempts: 2, maxCostUsd: 0.5, providerRetries: 2, retryBaseMs: 800, skipOcr: false };

export interface PipelineDeps {
  provider: ImageProvider;
  ocr: OcrEngine;
  store: ImageStore;
  loadGateContext(job: ImageJob): Promise<GateContext>;
  loadInspirations(job: ImageJob): Promise<InspirationRef[]>;
  loadRecentLayouts(restaurantId: string): Promise<string[]>;
  /** Optionnel : photos du resto (subject_photo), logo (logo), images de style (style). */
  loadReferenceImages?(job: ImageJob, chosen: InspirationRef[]): Promise<ReferenceInput[]>;
  config?: Partial<PipelineConfig>;
  log?: (event: string, data?: Record<string, unknown>) => void;
}

export type PipelineOutcome =
  | { status: "blocked"; reasons: GateReason[] }
  | { status: "done"; result: ImageResult }
  // Aucune image fiable n'a pu être produite : le post part sans visuel ou est proposé au gérant à la main
  | { status: "failed"; reason: string; attempts: number; costUsd: number };

export const idempotencyKey = (j: ImageJob) => `${j.restaurantId}/${j.campaignId}/${j.channel}/${j.format}`;

const ROLE_ORDER: Record<ReferenceRole, number> = { subject_photo: 0, logo: 1, style: 2 };

export async function runImagePipeline(job: ImageJob, deps: PipelineDeps): Promise<PipelineOutcome> {
  const cfg = { ...DEFAULT_CONFIG, ...deps.config };
  const log = deps.log ?? (() => {});
  const key = idempotencyKey(job);
  const extras = job.restaurantName ? [job.restaurantName] : [];

  // 0. Idempotence : jamais deux générations (ni deux factures) pour la même campagne
  const existing = await deps.store.getResult(key);
  if (existing) return { status: "done", result: { ...existing, cached: true } };

  // 1. Portier : règles dures avant tout appel payant
  const gate = imageGate(job, await deps.loadGateContext(job));
  if (!gate.allowed) {
    log("gate_blocked", { reasons: gate.reasons });
    return { status: "blocked", reasons: gate.reasons };
  }

  // 2. Inspirations, références, layout
  const refs = selectInspirations(job, await deps.loadInspirations(job));
  const layout = pickLayoutFamily(job.brand, await deps.loadRecentLayouts(job.restaurantId));
  const references = ((await deps.loadReferenceImages?.(job, refs.positives)) ?? [])
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
    .slice(0, cfg.maxReferences);
  log("references", { count: references.length, roles: references.map((r) => r.role) });
  const inspirationIds = refs.positives.map((r) => r.id);

  let cost = 0;
  let attempts = 0;
  let model = deps.provider.name;
  const fail = (reason: string): PipelineOutcome => {
    log("failed", { reason });
    return { status: "failed", reason, attempts, costUsd: cost };
  };

  /** Une génération + relecture OCR. Lance une erreur typée si le fournisseur ou l'OCR tombe. */
  const generateAndRead = async (prompt: string, refsToSend: ReferenceInput[]) => {
    attempts++;
    let img;
    try {
      img = await withRetry(
        () => deps.provider.generate({
          prompt, format: job.format, seed: job.brand.seed,
          references: refsToSend.map((r) => ({ data: r.data, mime: r.mime })),
        }),
        { retries: cfg.providerRetries, baseMs: cfg.retryBaseMs, sleep: cfg.sleep, onRetry: (e, n) => log("provider_retry", { kind: e.kind, n }) },
      );
    } catch (e) {
      throw Object.assign(new Error("provider"), { reason: `provider_${e instanceof ProviderError ? e.kind : "unknown"}`, cause: e });
    }
    cost += img.costUsd;
    model = img.model;
    let ocrText: string;
    if (cfg.skipOcr) {
      ocrText = job.facts.map((f) => f.value).join(" ") + (job.restaurantName ? ` ${job.restaurantName}` : "");
    } else {
      try {
        ocrText = await deps.ocr.read(img.data, img.mime);
      } catch (e) {
        // On ne livre jamais une image dont le texte n'a pas pu être vérifié
        throw Object.assign(new Error("ocr"), { reason: "ocr_unavailable", cause: e });
      }
    }
    return { img, ocrText };
  };

  const finish = async (mode: ImageResult["mode"], img: { data: Buffer; mime: string }, hash: string, fallbackReason?: string): Promise<PipelineOutcome> => {
    const url = await deps.store.saveImage(key, img.data, img.mime);
    const result: ImageResult = {
      url, mode, ocrMatch: true, attempts, model, costUsd: cost, promptHash: hash, inspirationIds,
      ...(fallbackReason ? { fallbackReason } : {}),
    };
    await deps.store.putResult(key, result);
    return { status: "done", result };
  };

  // 3. Génération avec texte + contrôle exact, avec retry ciblé
  const base = buildPrompt(job, refs, layout, references.map((r) => r.role));
  let correction = "";
  while (attempts < cfg.maxAttempts) {
    try {
      const { img, ocrText } = await generateAndRead(base.prompt + correction, references);
      const qa = checkImageText(ocrText, job.facts, extras);
      log("qa", { attempt: attempts, ok: qa.ok, missing: qa.missing, unexpected: qa.unexpectedWords });
      if (qa.ok) return await finish("full_ai", img, base.hash);
      correction =
        `\n\n[CORRECTION]\nThe previous image had text errors.` +
        (qa.missing.length ? ` Missing or wrong: ${qa.missing.map((m) => `"${m}"`).join(", ")}.` : "") +
        (qa.unexpectedWords.length ? ` Remove these words that must not appear: ${qa.unexpectedWords.join(", ")}.` : "") +
        ` Write exactly the EXACT TEXT strings, nothing else.`;
    } catch (e) {
      return fail((e as { reason?: string }).reason ?? "unknown");
    }
    if (cost >= cfg.maxCostUsd) return fail("cost_cap");
  }

  // 4. Secours 100 % IA : image sans aucun texte (les faits restent dans la légende du post)
  log("fallback_text_free", {});
  const tfRefs = references.filter((r) => r.role !== "logo");   // le logo contient du texte
  const tf = buildPrompt(job, refs, layout, tfRefs.map((r) => r.role), { textFree: true });
  try {
    const { img, ocrText } = await generateAndRead(tf.prompt, tfRefs);
    const qa = checkImageText(ocrText, [], extras);
    log("qa_text_free", { ok: qa.ok, unexpected: qa.unexpectedWords });
    if (qa.ok) return await finish("text_free_fallback", img, tf.hash, "text_mismatch");
    return fail("text_free_failed");
  } catch (e) {
    return fail((e as { reason?: string }).reason ?? "unknown");
  }
}
