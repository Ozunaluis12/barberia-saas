"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { sendWhatsAppMessage } from "@/lib/notifications";

/** Quita a alguien de la lista de espera — ya reservó, ya no le interesa, o lo contactaron a mano. */
export async function removeWaitlistEntry(entryId: string) {
  const session = await requireSession();
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, businessId: session.businessId },
  });
  if (!entry) return;

  await prisma.waitlistEntry.delete({ where: { id: entryId } });
  revalidatePath("/dashboard/waitlist");
}

/**
 * Avisa a mano por WhatsApp que se liberó un horario. Ya no es automático:
 * el negocio decide a quién y cuándo avisar, en vez de que el sistema le
 * escriba solo apenas se cancela cualquier cita que calce.
 */
export async function notifyWaitlistEntry(entryId: string) {
  const session = await requireSession();
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, businessId: session.businessId },
  });
  if (!entry) return;

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) return;

  await sendWhatsAppMessage(
    entry.clientPhone,
    `Hola ${entry.clientName}, se liberó un horario el ${entry.day} en ${business.name}. Si sigues interesado, agenda cuanto antes: reservas en el mismo enlace de siempre.`
  );

  await prisma.waitlistEntry.update({ where: { id: entryId }, data: { notifiedAt: new Date() } });
  revalidatePath("/dashboard/waitlist");
}
