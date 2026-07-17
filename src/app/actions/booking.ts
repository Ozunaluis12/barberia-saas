"use server";

import { prisma } from "@/lib/db";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient } from "@/lib/clients";

export async function fetchSlots(params: {
  shopSlug: string;
  serviceId: string;
  barberId: string | null;
  day: string;
}) {
  const shop = await prisma.shop.findUnique({ where: { slug: params.shopSlug } });
  if (!shop) return [];
  return getAvailableSlots({
    shopId: shop.id,
    serviceId: params.serviceId,
    barberId: params.barberId,
    day: params.day,
  });
}

export type CreateBookingResult =
  | { ok: true; barberName: string; startTime: string; appointmentId: string }
  | { ok: false; error: string };

export async function createBooking(params: {
  shopSlug: string;
  serviceId: string;
  barberId: string | null; // null = "cualquiera disponible"
  day: string;
  time: string;
  clientName: string;
  clientPhone: string;
}): Promise<CreateBookingResult> {
  const shop = await prisma.shop.findUnique({ where: { slug: params.shopSlug } });
  if (!shop) return { ok: false, error: "Barbería no encontrada." };

  if (!params.clientName.trim() || !params.clientPhone.trim()) {
    return { ok: false, error: "Nombre y teléfono son obligatorios." };
  }

  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, shopId: shop.id, active: true },
  });
  if (!service) return { ok: false, error: "Servicio no válido." };

  // Recalculamos disponibilidad en el momento de confirmar para evitar choques de horario.
  const slots = await getAvailableSlots({
    shopId: shop.id,
    serviceId: params.serviceId,
    barberId: params.barberId,
    day: params.day,
  });
  const match = slots.find((s) => s.time === params.time);
  if (!match) {
    return { ok: false, error: "Ese horario ya no está disponible, por favor elige otro." };
  }

  const startTime = combineDayAndTime(params.day, params.time);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

  const client = await findOrCreateClient(shop.id, params.clientName, params.clientPhone);

  const appointment = await prisma.appointment.create({
    data: {
      shopId: shop.id,
      barberId: match.barberId,
      serviceId: service.id,
      clientId: client.id,
      clientName: params.clientName.trim(),
      clientPhone: params.clientPhone.trim(),
      startTime,
      endTime,
      status: "CONFIRMED",
      source: "ONLINE",
      anyBarberRequested: params.barberId === null,
    },
  });

  return {
    ok: true,
    barberName: match.barberName,
    startTime: startTime.toISOString(),
    appointmentId: appointment.id,
  };
}
