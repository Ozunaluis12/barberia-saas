import { headers } from "next/headers";

// Rate-limit simple en memoria (una sola instancia del proceso Node). No es
// infraestructura de captcha real, solo una barrera práctica contra spam
// básico en formularios públicos mientras el negocio no necesite más.
const hits = new Map<string, number[]>();

/** IP del cliente a partir de los headers del proxy (Render los agrega). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** true = permitido, false = superó el límite en la ventana dada. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return true;
}
