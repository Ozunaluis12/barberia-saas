"use server";

import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/guard";
import { sendWhatsAppMessage } from "@/lib/notifications";

export type BroadcastResult =
  | { ok: true; sent: number; failed: number; total: number }
  | { ok: false; error: string };

export async function sendBroadcast(message: string): Promise<BroadcastResult> {
  const session = await requireOwner();
  const trimmed = message.trim();
  if (!trimmed) return { ok: false, error: "Escribe un mensaje antes de enviar." };

  const clients = await prisma.client.findMany({
    where: { organizationId: session.organizationId, marketingOptIn: true },
  });

  let sent = 0;
  let failed = 0;
  // Envío secuencial, sin cola: mismo patrón que scripts/send-reminders.ts,
  // suficiente para el volumen de clientes de un solo negocio.
  for (const client of clients) {
    const result = await sendWhatsAppMessage(client.phone, trimmed);
    if (result.sent) sent += 1;
    else failed += 1;
  }

  return { ok: true, sent, failed, total: clients.length };
}
