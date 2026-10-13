import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { GOLDEN_CASES } from "./golden/cases";
import { RESTAURANTS } from "./golden/restaurants";
import { buildPrompt, selectInspirations, type ImageJob, type Scenario } from "./engine";
import { createLocalPipelineDeps, loadLocalInspirations, loadLocalReferenceImages } from "./pipeline/localDeps";
import { LocalImageStore } from "./pipeline/localStore";
import { runImagePipeline } from "./pipeline/pipeline";
import { OpenRouterVisionOcr } from "./provider/ocr";
import { OpenRouterImagesProvider } from "./provider/openrouterImages";
import type { ImageProvider, OcrEngine } from "./provider/types";

const PORT = Number(process.env.PORT ?? 3001);
const ROOT = process.cwd();

// Charge les variables du fichier .env s'il existe
function loadEnv() {
  const envPath = join(ROOT, ".env");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [k, ...v] = trimmed.split("=");
        if (k && v.length) process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}
loadEnv();

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function serveFile(res: ServerResponse, filePath: string) {
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }
  const ext = extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": mime });
  res.end(readFileSync(filePath));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const store = new LocalImageStore(join(ROOT, "outputs"));

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers pour dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Endpoints API
  if (pathname === "/api/info" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      hasEnvKey: Boolean(process.env.OPENROUTER_API_KEY),
      restaurants: RESTAURANTS.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.venue.type,
        palette: r.brand.palette,
        hasPatio: r.venue.hasPatio,
      })),
      cases: GOLDEN_CASES.map((c) => ({
        id: c.id,
        restaurantId: c.restaurantId,
        scenario: c.scenario,
        facts: c.facts,
        allowed: c.expected.allowed,
      })),
    }));
    return;
  }

  if (pathname === "/api/generate" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const restaurantId = body.restaurantId ?? "tap";
      const restaurant = RESTAURANTS.find((r) => r.id === restaurantId);

      if (!restaurant) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Restaurant introuvable" }));
        return;
      }

      const apiKey = body.apiKey || process.env.OPENROUTER_API_KEY;
      const isMock = body.useMock || !apiKey;

      const workflowLogs: { step: string; title: string; detail: any }[] = [];
      const log = (step: string, detail: any) => {
        workflowLogs.push({ step, title: step.replace(/_/g, " ").toUpperCase(), detail });
      };

      let provider: ImageProvider;
      let ocr: OcrEngine;

      if (isMock) {
        log("init", { mode: "simulation", message: "Génération factice locale (sans dépense API)" });
        provider = {
          name: "mock-model",
          generate: async (reqGen) => {
            log("provider_call", {
              format: reqGen.format,
              referencesCount: reqGen.references?.length ?? 0,
              promptSample: reqGen.prompt.slice(0, 160) + "...",
            });
            // 1x1 pixel image ou image de test
            const fakeBuffer = Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
              "base64",
            );
            return {
              data: fakeBuffer,
              mime: "image/png",
              model: "mock-gpt-image-2",
              costUsd: 0.13,
              latencyMs: 750,
            };
          },
        };
        ocr = {
          read: async () => {
            const simulatedText = body.facts?.map((f: any) => f.value).join("\n") ?? "HEADLINE";
            log("ocr_read", { text: simulatedText, status: "OK - Conforme à la Fact Sheet" });
            return simulatedText;
          },
        };
      } else {
        log("init", { mode: "openrouter", model: process.env.IMAGE_MODEL ?? "openai/gpt-image-2" });
        provider = new OpenRouterImagesProvider({
          apiKey,
          model: process.env.IMAGE_MODEL ?? "openai/gpt-image-2",
        });
        ocr = new OpenRouterVisionOcr({
          apiKey,
          model: process.env.OCR_MODEL ?? "anthropic/claude-3.5-haiku",
        });
      }

      const job: ImageJob = {
        jobId: `job-${Date.now()}`,
        restaurantId,
        campaignId: body.campaignId ?? `camp-${Date.now()}`,
        scenario: body.scenario ?? "daily_special",
        format: body.format ?? "square_1080",
        channel: body.channel ?? "instagram",
        facts: body.facts ?? [{ key: "headline", value: "Daily Special $12" }],
        brand: restaurant.brand,
        restaurantName: restaurant.name,
      };

      const deps = createLocalPipelineDeps({
        provider,
        ocr,
        store,
        severeWeatherAlert: body.severeWeatherAlert ?? false,
      });

      // Injection du logger et désactivation OCR demandée
      deps.log = (evt, data) => log(evt, data);
      deps.config = { skipOcr: true };

      const outcome = await runImagePipeline(job, deps);

      // Références chargées pour l'aperçu UI
      const inspirations = await deps.loadInspirations(job);
      const chosenInspirations = selectInspirations(job, inspirations).positives;
      const loadedRefs = await deps.loadReferenceImages?.(job, chosenInspirations) ?? [];

      let relativeImageUrl = null;
      if (outcome.status === "done") {
        const fileUrl = outcome.result.url;
        // extrait le chemin relatif depuis outputs/
        const match = fileUrl.match(/outputs[\\/](images[\\/].+)$/);
        if (match) {
          relativeImageUrl = `/${match[1].replace(/\\/g, "/")}`;
        }
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        outcome,
        workflow: workflowLogs,
        imageUrl: relativeImageUrl,
        referencesCount: loadedRefs.length,
        references: loadedRefs.map((r) => ({ role: r.role, mime: r.mime })),
        promptInfo: buildPrompt(job, { positives: chosenInspirations, negatives: [] }, restaurant.brand.layoutFamilies[0]),
      }));
    } catch (err: any) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message ?? "Erreur serveur" }));
    }
    return;
  }

  // 2. Fichiers statiques (dashboard, assets, outputs)
  if (pathname === "/" || pathname === "/index.html") {
    serveFile(res, join(ROOT, "public", "index.html"));
    return;
  }

  if (pathname.startsWith("/assets/")) {
    serveFile(res, join(ROOT, pathname));
    return;
  }

  if (pathname.startsWith("/images/")) {
    serveFile(res, join(ROOT, "outputs", pathname));
    return;
  }

  serveFile(res, join(ROOT, "public", pathname));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` GETSPECIAL IMAGE ENGINE - DASHBOARD LOCAL ACTIF`);
  console.log(` -> URL : http://localhost:${PORT}`);
  console.log(` -> Mode Clé OpenRouter : ${process.env.OPENROUTER_API_KEY ? "Configurée dans .env" : "Non configurée (simulation mock par défaut)"}`);
  console.log(`======================================================\n`);
});
