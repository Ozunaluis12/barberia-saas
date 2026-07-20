"use server";

import { prisma } from "@/lib/db";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient } from "@/lib/clients";

export async function fetchSlots(params: {
  businessSlug: string;
  serviceId: string;
  staffId: string | null;
  day: string;
}) {
  const business = await prisma.business.findUnique({ where: { slug: params.businessSlug } });
  if (!business) return [];
  return getAvailableSlots({
    businessId: business.id,
    serviceId: params.serviceId,
    staffId: params.staffId,
    day: params.day,
  });
}

export type CreateBookingResult =
  | { ok: true; staffName: string; startTime: string; appointmentId: string }
  | { ok: false; error: string };

export async function createBooking(params: {
  businessSlug: string;
  serviceId: string;
  staffId: string | null; // null = "cualquiera disponible"
  day: string;
  time: string;
  clientName: string;
  clientPhone: string;
}): Promise<CreateBookingResult> {
  const business = await prisma.business.findUnique({ where: { slug: params.businessSlug } });
  if (!business) return { ok: false, error: "Negocio no encontrado." };

  if (!params.clientName.trim() || !params.clientPhone.trim()) {
    return { ok: false, error: "Nombre y teléfono son obligatorios." };
  }

  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, businessId: business.id, active: true },
  });
  if (!service) return { ok: false, error: "Servicio no válido." };

  const client = await findOrCreateClient(business.organizationId, params.clientName, params.clientPhone);

  // Todo lo demás corre dentro de una transacción con un lock exclusivo por negocio,
  // para que dos reservas simultáneas no puedan leer el mismo hueco como libre y
  // terminar chocando (condición de carrera).
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${business.id})::bigint)`;

      const slots = await getAvailableSlots(
        {
          businessId: business.id,
          serviceId: params.serviceId,
          staffId: params.staffId,
          day: params.day,
        },
        tx
      );
      const match = slots.find((s) => s.time === params.time);
      if (!match) {
        return { ok: false, error: "Ese horario ya no está disponible, por favor elige otro." };
      }

      const startTime = combineDayAndTime(params.day, params.time);
      const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

      const appointment = await tx.appointment.create({
        data: {
          businessId: business.id,
          staffId: match.staffId,
          serviceId: service.id,
          clientId: client.id,
          clientName: params.clientName.trim(),
          clientPhone: params.clientPhone.trim(),
          startTime,
          endTime,
          status: "CONFIRMED",
          source: "ONLINE",
          anyStaffRequested: params.staffId === null,
          priceCharged: service.price,
        },
      });

      return {
        ok: true,
        staffName: match.staffName,
        startTime: startTime.toISOString(),
        appointmentId: appointment.id,
      };
    },
    { timeout: 15000, maxWait: 15000 }
  );
}
