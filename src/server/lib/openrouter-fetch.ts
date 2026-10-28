import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

let preferCurlDirectly = process.platform === 'win32';

/**
 * Fetch ultra-résilient pour OpenRouter :
 * Sous Windows, utilise directement curl.exe (stack SChannel native) pour éviter
 * les blocages de handshake TLS 1.3 / IPv6 de Node vers Cloudflare.
 */
export async function resilientOpenrouterFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isDirectImageDownload = !url.includes('openrouter.ai');

  // Si c'est un téléchargement direct d'image (ex: Unsplash ou CDN), fetch natif
  if (isDirectImageDownload) {
    return await fetch(url, options);
  }

  // Si curl est déjà favorisé (Windows), exécuter immédiatement sans latence
  if (preferCurlDirectly) {
    try {
      return await executeCurlFallback(url, options);
    } catch (curlErr: any) {
      console.warn('[OpenRouterFetch] Fallback curl a échoué, essai fetch natif...', curlErr.message);
      preferCurlDirectly = false;
    }
  }

  // Pour OpenRouter : contrôleur de connexion court (3s)
  const fastConnectController = new AbortController();
  const callerSignal = options.signal as AbortSignal | undefined;

  let abortedByCaller = false;
  const onCallerAbort = () => {
    abortedByCaller = true;
    fastConnectController.abort();
  };

  if (callerSignal) {
    if (callerSignal.aborted) throw new Error('Requête annulée par l\'appelant.');
    callerSignal.addEventListener('abort', onCallerAbort, { once: true });
  }

  const connectTimer = setTimeout(() => {
    fastConnectController.abort();
  }, 3000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: fastConnectController.signal,
    });
    clearTimeout(connectTimer);
    if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);
    return res;
  } catch (fetchErr: any) {
    clearTimeout(connectTimer);
    if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);

    if (abortedByCaller) {
      throw new Error('Requête annulée par l\'appelant.');
    }

    preferCurlDirectly = true;
    return await executeCurlFallback(url, options);
  }
}

async function executeCurlFallback(url: string, options: RequestInit): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = options.headers ? new Headers(options.headers) : new Headers();

  const tempDir = os.tmpdir();
  const tempBodyFile = path.join(tempDir, `gs_req_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
  let hasBodyFile = false;

  const args: string[] = ['-4', '-s', '-S', '-i', '--max-time', '60', '-X', method];

  headers.forEach((val, key) => {
    args.push('-H', `${key}: ${val}`);
  });

  if (options.body && method !== 'GET') {
    const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    fs.writeFileSync(tempBodyFile, bodyStr, 'utf8');
    hasBodyFile = true;
    args.push('--data-binary', `@${tempBodyFile}`);
  }

  args.push(url);

  return new Promise<Response>((resolve, reject) => {
    const child = spawn('curl.exe', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (c) => stdoutChunks.push(c));
    child.stderr.on('data', (c) => stderrChunks.push(c));

    child.on('error', (err) => {
      if (hasBodyFile && fs.existsSync(tempBodyFile)) fs.unlinkSync(tempBodyFile);
      reject(new Error(`curl.exe fallback impossible: ${err.message}`));
    });

    child.on('close', (code) => {
      if (hasBodyFile && fs.existsSync(tempBodyFile)) {
        try { fs.unlinkSync(tempBodyFile); } catch {}
      }

      if (code !== 0) {
        const errOut = Buffer.concat(stderrChunks).toString('utf8');
        return reject(new Error(`curl.exe code ${code}: ${errOut}`));
      }

      const fullOutput = Buffer.concat(stdoutChunks).toString('utf8');
      const headerEndIndex = fullOutput.indexOf('\r\n\r\n');
      const doubleNIndex = fullOutput.indexOf('\n\n');

      let splitIndex = headerEndIndex !== -1 ? headerEndIndex : doubleNIndex;
      let headerText = '';
      let bodyText = '';

      if (splitIndex !== -1) {
        headerText = fullOutput.slice(0, splitIndex);
        bodyText = fullOutput.slice(splitIndex + (headerEndIndex !== -1 ? 4 : 2));
      } else {
        bodyText = fullOutput;
      }

      // Extraction du code de statut HTTP (ex: HTTP/1.1 200 OK)
      const statusMatch = headerText.match(/HTTP\/[0-9.]+\s+([0-9]{3})/i);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 200;

      // Construction d'une Response standard
      const mockResponse = new Response(bodyText, {
        status,
        statusText: status === 200 ? 'OK' : 'Error',
      });

      resolve(mockResponse);
    });
  });
}
