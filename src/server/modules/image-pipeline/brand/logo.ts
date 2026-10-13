import { createHash } from "node:crypto";
import { checkImageText, type BrandDNA } from "../engine";
import type { ImageStore } from "../pipeline/store";
import { withRetry } from "../provider/retry";
import { ProviderError, type ImageProvider, type OcrEngine } from "../provider/types";

export interface LogoInput {
  restaurantId: string;
  restaurantName: string;      // orthographe exacte : c'est le seul texte autorisé dans le logo
  venueType: string;           // ex: "sports_bar"
  brand: BrandDNA;
}

export type LogoOutcome =
  | { status: "done"; url: string; attempts: number; costUsd: number; promptHash: string }
  | { status: "failed"; reason: string; attempts: number; costUsd: number };

export interface LogoDeps {
  provider: ImageProvider;
  ocr: OcrEngine;
  store: ImageStore;
  config?: { maxAttempts?: number; providerRetries?: number; retryBaseMs?: number; sleep?: (ms: number) => Promise<void> };
  log?: (event: string, data?: Record<string, unknown>) => void;
}

export const logoStorageKey = (i: LogoInput) => `${i.restaurantId}/brand/logo/v${i.brand.version}`;

export function buildLogoPrompt(i: LogoInput): { prompt: string; hash: string } {
  const b = i.brand;
  const prompt = [
    `[RULES]\n- Design a simple, bold logo for a ${i.venueType.replace(/_/g, " ")}, readable at 64 px.\n` +
      `- Write ONLY this exact name: "${i.restaurantName}". No tagline, no other words, no numbers.\n` +
      `- Flat vector style, centered, on a plain solid background. No photos, no mockups, no people.\n` +
      `- Generous margins: the whole logo must sit well inside the frame.`,
    `[BRAND DNA]\npalette: ${b.palette.join(", ")}\ntypography: ${b.typographyStyle}\nmood: ${b.moodKeywords.join(", ")}\n` +
      `do: ${b.doList.join("; ") || "-"}\ndon't: ${b.dontList.join("; ") || "-"}`,
    `[FORMAT]\nsquare 1:1 composition`,
  ].join("\n\n");
  return { prompt, hash: createHash("sha256").update(prompt).digest("hex").slice(0, 16) };
}

/**
 * Génère le logo UNE fois (onboarding). Ensuite il est renvoyé comme image de référence à chaque post,
 * pour que le restaurant ait toujours le même logo. Le nom est vérifié par OCR.
 */
export async function generateLogo(input: LogoInput, deps: LogoDeps): Promise<LogoOutcome> {
  const max = deps.config?.maxAttempts ?? 3;
  const log = deps.log ?? (() => {});
  const { prompt, hash } = buildLogoPrompt(input);
  let attempts = 0;
  let cost = 0;
  let correction = "";

  while (attempts < max) {
    attempts++;
    try {
      const img = await withRetry(
        () => deps.provider.generate({ prompt: prompt + correction, format: "square_1080", seed: input.brand.seed }),
        { retries: deps.config?.providerRetries ?? 2, baseMs: deps.config?.retryBaseMs ?? 800, sleep: deps.config?.sleep },
      );
      cost += img.costUsd;
      const qa = checkImageText(await deps.ocr.read(img.data, img.mime), [{ key: "name", value: input.restaurantName }]);
      log("logo_qa", { attempt: attempts, ok: qa.ok, missing: qa.missing, unexpected: qa.unexpectedWords });
      if (qa.ok) {
        const url = await deps.store.saveImage(logoStorageKey(input), img.data, img.mime);
        return { status: "done", url, attempts, costUsd: cost, promptHash: hash };
      }
      correction = `\n\n[CORRECTION]\nThe previous logo had a spelling error or extra words. Write exactly "${input.restaurantName}" and nothing else.`;
    } catch (e) {
      const kind = e instanceof ProviderError ? e.kind : "unknown";
      return { status: "failed", reason: `provider_${kind}`, attempts, costUsd: cost };
    }
  }
  return { status: "failed", reason: "name_mismatch", attempts, costUsd: cost };
}
