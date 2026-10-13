import { ProviderError, type GenerateRequest, type GeneratedImage, type ImageProvider } from "./types";
import { ASPECT, mapHttpError } from "./openrouter";

export interface OpenRouterImagesConfig {
  apiKey: string;
  model: string;                                  // ex: "openai/gpt-image-2"
  quality?: "auto" | "low" | "medium" | "high";   // coût et lisibilité du texte : à benchmarker
  outputFormat?: "png" | "jpeg" | "webp";
  baseUrl?: string;
  timeoutMs?: number;                             // une génération haute qualité peut dépasser 90 s
  appReferer?: string;
  appTitle?: string;
  sendSeed?: boolean;                             // seulement si le modèle le supporte
  provider?: Record<string, unknown>;             // routage OpenRouter (only, order, allow_fallbacks…)
  fetchImpl?: typeof fetch;
}

/**
 * API image dédiée d'OpenRouter : POST /api/v1/images.
 * C'est celle qu'utilise openai/gpt-image-2. Réponse : data[].b64_json + usage.cost.
 */
export class OpenRouterImagesProvider implements ImageProvider {
  readonly name = "openrouter-images";
  private readonly f: typeof fetch;

  constructor(private readonly cfg: OpenRouterImagesConfig) {
    this.f = cfg.fetchImpl ?? fetch;
  }

  async generate(req: GenerateRequest): Promise<GeneratedImage> {
    const c = this.cfg;
    const started = Date.now();

    const body: Record<string, unknown> = {
      model: c.model,
      prompt: req.prompt,
      n: 1,
      aspect_ratio: ASPECT[req.format],
      quality: c.quality ?? "medium",
      output_format: c.outputFormat ?? "png",
    };
    if (req.references?.length) {
      body.input_references = req.references.map((r) => ({
        type: "image_url",
        image_url: { url: `data:${r.mime};base64,${r.data.toString("base64")}` },
      }));
    }
    if (c.sendSeed && req.seed !== undefined) body.seed = req.seed;
    if (c.provider) body.provider = c.provider;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), c.timeoutMs ?? 180_000);
    let res: Response;
    try {
      res = await this.f(`${c.baseUrl ?? "https://openrouter.ai/api/v1"}/images`, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${c.apiKey}`,
          "Content-Type": "application/json",
          ...(c.appReferer ? { "HTTP-Referer": c.appReferer } : {}),
          ...(c.appTitle ? { "X-Title": c.appTitle } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") throw new ProviderError("timeout", "timeout", true);
      throw new ProviderError(`network: ${(e as Error).message}`, "network", true);
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* corps non JSON */ }

    // 502 = génération échouée côté amont : non facturée, on peut réessayer
    if (!res.ok) throw mapHttpError(res.status, json?.error?.message ?? text.slice(0, 200));

    const first = json?.data?.[0];
    if (!first?.b64_json) throw new ProviderError("Aucune image dans la réponse", "no_image", true);

    return {
      data: Buffer.from(first.b64_json, "base64"),
      mime: first.media_type ?? "image/png",
      model: c.model,
      costUsd: Number(json?.usage?.cost ?? 0),
      latencyMs: Date.now() - started,
    };
  }
}
