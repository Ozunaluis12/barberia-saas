import { toE164 } from "@/lib/notifications";

/** Arma un enlace wa.me a un número real, con el mensaje pre-llenado. */
export function buildWhatsAppLink(phone: string, message: string): string | null {
  const normalized = toE164(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}
