import type { ImageFormat } from "../engine";
import { ProviderError, type GenerateRequest, type GeneratedImage, type ImageProvider } from "./types";

export interface OpenRouterImageConfig {
  apiKey: string;
  model: string;                          // ex: un modèle listé avec output_modalities "image"
  outputModalities?: Array<"image" | "text">; // ["image","text"] (Gemini…) ou ["image"] (Flux, Sourceful…)
  baseUrl?: string;
  timeoutMs?: number;
  appReferer?: string;                    // en-têtes optionnels d'attribution OpenRouter
  appTitle?: string;
  sendImageConfig?: boolean;              // envoie image_config.aspect_ratio (désactiver si le modèle refuse)
  sendSeed?: boolean;
  fetchImpl?: typeof fetch;               // injectable pour les tests
}

export const ASPECT: Record<ImageFormat, string> = {
  square_1080: "1:1",
  portrait_4x5: "4:5",
  landscape_4x3: "4:3",
};

export function parseDataUrl(url: string): { data: Buffer; mime: string } | null {
  const m = /^data:([^;,]+);base64,([\\s\\S]+)$/.exec(url);
  return m ? { mime: m[1], data: Buffer.from(m[2], "base64") } : null;
}

export class OpenRouterImageProvider implements ImageProvider {
  readonly name = "openrouter";
  private readonly f: typeof fetch;

  constructor(private readonly cfg: OpenRouterImageConfig) {
    this.f = cfg.fetchImpl ?? fetch;
  }

  async generate(req: GenerateRequest): Promise<GeneratedImage> {
    const c = this.cfg;
    const started = Date.now();

    const content: unknown = req.references?.length
      ? [
          { type: "text", text: req.prompt },
          ...req.references.map((r) => ({
            type: "image_url",
            image_url: { url: `data:${r.mime};base64,${r.data.toString("base64")}` },
          })),
        ]
      : req.prompt;

    const body: Record<string, unknown> = {
      model: c.model,
      messages: [{ role: "user", content }],
      modalities: c.outputModalities ?? ["image", "text"],
      stream: false,
    };
    if (c.sendImageConfig !== false) body.image_config = { aspect_ratio: ASPECT[req.format] };
    if (c.sendSeed && req.seed !== undefined) body.seed = req.seed;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), c.timeoutMs ?? 90_000);
    let res: Response;
    try {
      res = await this.f(`${c.baseUrl ?? "https://openrouter.ai/api/v1"}/chat/completions`, {
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

    if (!res.ok) throw mapHttpError(res.status, json?.error?.message ?? text.slice(0, 200));
    // OpenRouter peut renvoyer 200 avec un champ "error" (erreur du fournisseur amont)
    if (json?.error) throw mapHttpError(Number(json.error.code) || 502, json.error.message ?? "upstream error");

    const msg = json?.choices?.[0]?.message;
    const img = msg?.images?.[0];
    const url: string | undefined = img?.image_url?.url ?? img?.imageUrl?.url;
    if (!url) {
      throw new ProviderError("Aucune image dans la réponse (refus du modèle ou modèle sans sortie image)", "no_image", true);
    }

    let parsed = parseDataUrl(url);
    if (!parsed) {
      // URL http(s) : on télécharge
      try {
        const r = await this.f(url);
        if (!r.ok) throw new Error(String(r.status));
        parsed = { data: Buffer.from(await r.arrayBuffer()), mime: r.headers.get("content-type") ?? "image/png" };
      } catch (e) {
        throw new ProviderError(`téléchargement de l'image impossible: ${(e as Error).message}`, "network", true);
      }
    }

    return {
      data: parsed.data,
      mime: parsed.mime,
      model: json?.model ?? c.model,
      costUsd: Number(json?.usage?.cost ?? 0),   // présent si OpenRouter renvoie le coût
      latencyMs: Date.now() - started,
    };
  }
}

export function mapHttpError(status: number, message: string): ProviderError {
  if (status === 401 || status === 403) return new ProviderError(`auth: ${message}`, "auth", false, status);
  if (status === 402) return new ProviderError(`crédits insuffisants: ${message}`, "credits", false, status);
  if (status === 400 || status === 404 || status === 422) return new ProviderError(`requête refusée: ${message}`, "bad_request", false, status);
  if (status === 408) return new ProviderError(`timeout amont: ${message}`, "timeout", true, status);
  if (status === 429) return new ProviderError(`limite de débit: ${message}`, "rate_limit", true, status);
  return new ProviderError(`serveur ${status}: ${message}`, "server", true, status);
}
