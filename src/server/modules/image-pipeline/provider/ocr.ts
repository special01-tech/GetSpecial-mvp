import { ProviderError, type OcrEngine } from "./types";
import { mapHttpError } from "./openrouter";

export interface VisionOcrConfig {
  apiKey: string;
  model: string;               // un modèle vision peu coûteux, choisi par vous
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const INSTRUCTION =
  "Transcribe ALL visible text in this image exactly as written, character for character. " +
  "Do not correct, translate or complete anything. Keep numbers, currency symbols and punctuation. " +
  "One text block per line. Output only the transcription. If there is no text, output NONE.";

/** OCR via un modèle vision d'OpenRouter : pas de dépendance native à installer. */
export class OpenRouterVisionOcr implements OcrEngine {
  private readonly f: typeof fetch;
  constructor(private readonly cfg: VisionOcrConfig) {
    this.f = cfg.fetchImpl ?? fetch;
  }

  async read(image: Buffer, mime: string): Promise<string> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeoutMs ?? 45_000);
    try {
      const res = await this.f(`${this.cfg.baseUrl ?? "https://openrouter.ai/api/v1"}/chat/completions`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${this.cfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.cfg.model,
          temperature: 0,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: INSTRUCTION },
              { type: "image_url", image_url: { url: `data:${mime};base64,${image.toString("base64")}` } },
            ],
          }],
        }),
      });
      const text = await res.text();
      if (!res.ok) throw mapHttpError(res.status, text.slice(0, 200));
      const out: string = JSON.parse(text)?.choices?.[0]?.message?.content ?? "";
      return out.trim().toUpperCase() === "NONE" ? "" : out;
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError(`ocr: ${(e as Error).message}`, "network", true);
    } finally {
      clearTimeout(timer);
    }
  }
}
