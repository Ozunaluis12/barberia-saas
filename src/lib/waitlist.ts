import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/notifications";

/**
 * Cuando una cita se cancela, revisa si alguien en la lista de espera pedía
 * ese mismo día/servicio (y staff, si lo pidió puntual) y le avisa por
 * WhatsApp que se liberó un horario. Marca notifiedAt para no repetir el aviso.
 */
export async function notifyWaitlistForFreedSlot(params: {
  businessId: string;
  serviceId: string;
  staffId: string;
  day: string; // YYYY-MM-DD
}) {
  const { businessId, serviceId, staffId, day } = params;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return;

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      businessId,
      serviceId,
      day,
      notifiedAt: null,
      OR: [{ staffId: null }, { staffId }],
    },
    orderBy: { createdAt: "asc" },
  });

  for (const entry of entries) {
    const body = `Hola ${entry.clientName}, se liberó un horario el ${day} en ${business.name}. Si sigues interesado, agenda cuanto antes: reservas en el mismo enlace de siempre.`;
    await sendWhatsAppMessage(entry.clientPhone, body);
    await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { notifiedAt: new Date() } });
  }
}
