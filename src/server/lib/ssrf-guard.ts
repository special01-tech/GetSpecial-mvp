const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // Cloud metadata AWS/GCP/Azure
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd00:/i,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

/**
 * Valide qu'une URL externe est sûre (protocole http/https public, aucune IP interne/cloud metadata)
 */
export function validateSafeExternalUrl(
  rawUrl: string,
  allowedHostnames?: string[]
): { safe: boolean; url?: URL; reason?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, reason: 'URL vide ou invalide.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: 'Format d’URL invalide.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { safe: false, reason: 'Seuls les protocoles HTTP/HTTPS sont autorisés.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        safe: false,
        reason: 'Les adresses réseau privées ou locales ne sont pas autorisées (Protection SSRF).',
      };
    }
  }

  if (allowedHostnames && allowedHostnames.length > 0) {
    const matchesAllowed = allowedHostnames.some(
      (allowed) => hostname === allowed.toLowerCase() || hostname.endsWith(`.${allowed.toLowerCase()}`)
    );
    if (!matchesAllowed) {
      return {
        safe: false,
        reason: `Domaine non autorisé (${hostname}).`,
      };
    }
  }

  return { safe: true, url: parsed };
}
