import type { ImageFormat } from "../engine";

export type ProviderErrorKind =
  | "auth" | "credits" | "bad_request" | "rate_limit" | "server" | "timeout" | "no_image" | "network";

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: ProviderErrorKind,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ReferenceImage { data: Buffer; mime: string }

export interface GenerateRequest {
  prompt: string;
  format: ImageFormat;
  seed?: number;
  references?: ReferenceImage[];   // images d'inspiration (si le modèle les accepte)
}

export interface GeneratedImage {
  data: Buffer;
  mime: string;
  model: string;
  costUsd: number;
  latencyMs: number;
}

/** Tout fournisseur d'image implémente ceci. Le reste du code ne connaît que cette interface. */
export interface ImageProvider {
  readonly name: string;
  generate(req: GenerateRequest): Promise<GeneratedImage>;
}

/** Lit le texte visible dans une image (pour comparer à la Fact Sheet). */
export interface OcrEngine {
  read(image: Buffer, mime: string): Promise<string>;
}
