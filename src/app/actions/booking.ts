"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient } from "@/lib/clients";
import { sendWhatsAppMessage } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

function addDaysToDay(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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
  | {
      ok: true;
      staffName: string;
      startTime: string;
      appointmentId: string;
      recurrence?: { created: number; requested: number; skippedDays: string[] };
      pendingPayment?: boolean;
    }
  | { ok: false; error: string };

export async function createBooking(params: {
  businessSlug: string;
  serviceId: string;
  staffId: string | null; // null = "cualquiera disponible"
  day: string;
  time: string;
  clientName: string;
  clientPhone: string;
  website?: string; // honeypot: si llega lleno, es un bot
  recurrence?: { intervalWeeks: 1 | 2 | 4; occurrences: number }; // occurrences = total incluyendo la primera
}): Promise<CreateBookingResult> {
  if (params.website && params.website.trim() !== "") {
    return { ok: false, error: "No se pudo procesar la reserva." };
  }

  const business = await prisma.business.findUnique({ where: { slug: params.businessSlug } });
  if (!business) return { ok: false, error: "Negocio no encontrado." };

  if (!params.clientName.trim() || !params.clientPhone.trim()) {
    return { ok: false, error: "Nombre y teléfono son obligatorios." };
  }

  const ip = await getClientIp();
  if (
    !checkRateLimit(`booking:phone:${params.clientPhone.trim()}`, 5, 10 * 60 * 1000) ||
    !checkRateLimit(`booking:ip:${ip}`, 20, 10 * 60 * 1000)
  ) {
    return { ok: false, error: "Demasiados intentos de reserva, espera unos minutos e inténtalo de nuevo." };
  }

  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, businessId: business.id, active: true },
  });
  if (!service) return { ok: false, error: "Servicio no válido." };

  const client = await findOrCreateClient(business.organizationId, params.clientName, params.clientPhone);

  // Todo lo demás corre dentro de una transacción con un lock exclusivo por negocio,
  // para que dos reservas simultáneas no puedan leer el mismo hueco como libre y
  // terminar chocando (condición de carrera).
  const result = await prisma.$transaction(
    async (tx): Promise<CreateBookingResult> => {
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

      const recurrenceGroupId =
        params.recurrence && params.recurrence.occurrences > 1 ? randomUUID() : null;

      // Solo la primera cita de una serie exige pago anticipado — cobrar cada
      // repetición por adelantado es un problema de cobro recurrente aparte.
      const requiresAdvancePayment = business.advancePaymentEnabled;

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
          status: requiresAdvancePayment ? "PENDING_PAYMENT" : "CONFIRMED",
          source: "ONLINE",
          anyStaffRequested: params.staffId === null,
          priceCharged: service.price,
          recurrenceGroupId,
          ...(requiresAdvancePayment
            ? { paymentMethod: "TRANSFER", paymentStatus: "AWAITING_VERIFICATION" }
            : {}),
        },
      });

      let recurrence: { created: number; requested: number; skippedDays: string[] } | undefined;
      if (recurrenceGroupId && params.recurrence) {
        let created = 1;
        const skippedDays: string[] = [];
        // Todas las repeticiones se agendan con el MISMO especialista que quedó
        // asignado en la primera cita (aunque se haya pedido "cualquiera"), para
        // que el cliente vea siempre a la misma persona en su serie recurrente.
        for (let i = 1; i < params.recurrence.occurrences; i++) {
          const nextDay = addDaysToDay(params.day, i * params.recurrence.intervalWeeks * 7);
          const nextSlots = await getAvailableSlots(
            { businessId: business.id, serviceId: params.serviceId, staffId: match.staffId, day: nextDay },
            tx
          );
          const nextMatch = nextSlots.find((s) => s.time === params.time);
          if (!nextMatch) {
            skippedDays.push(nextDay);
            continue;
          }
          const nextStartTime = combineDayAndTime(nextDay, params.time);
          const nextEndTime = new Date(nextStartTime.getTime() + service.durationMinutes * 60000);
          await tx.appointment.create({
            data: {
              businessId: business.id,
              staffId: match.staffId,
              serviceId: service.id,
              clientId: client.id,
              clientName: params.clientName.trim(),
              clientPhone: params.clientPhone.trim(),
              startTime: nextStartTime,
              endTime: nextEndTime,
              status: "CONFIRMED",
              source: "ONLINE",
              anyStaffRequested: params.staffId === null,
              priceCharged: service.price,
              recurrenceGroupId,
            },
          });
          created += 1;
        }
        recurrence = { created, requested: params.recurrence.occurrences, skippedDays };
      }

      return {
        ok: true,
        staffName: match.staffName,
        startTime: startTime.toISOString(),
        appointmentId: appointment.id,
        ...(recurrenceGroupId ? { recurrence } : {}),
        ...(requiresAdvancePayment ? { pendingPayment: true } : {}),
      };
    },
    { timeout: 15000, maxWait: 15000 }
  );

  // Fuera de la transacción: si quedó pendiente de pago, se le avisa al negocio
  // por el mismo WhatsApp donde va a recibir el comprobante, para que no se le
  // pase el plazo de confirmación revisando el panel manualmente.
  if (result.ok && result.pendingPayment && business.phone) {
    await sendWhatsAppMessage(
      business.phone,
      `Nueva reserva con pago pendiente: ${params.clientName.trim()} agendó ${service.name} el ${new Date(result.startTime).toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })} a las ${new Date(result.startTime).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}. Tienes ${business.advancePaymentExpirationHours} horas para confirmar el pago antes de que se libere el horario.`
    );
  }

  return result;
}

export type JoinWaitlistResult = { ok: true } | { ok: false; error: string };

export async function joinWaitlist(params: {
  businessSlug: string;
  serviceId: string;
  staffId: string | null;
  day: string;
  clientName: string;
  clientPhone: string;
}): Promise<JoinWaitlistResult> {
  const business = await prisma.business.findUnique({ where: { slug: params.businessSlug } });
  if (!business) return { ok: false, error: "Negocio no encontrado." };

  if (!params.clientName.trim() || !params.clientPhone.trim()) {
    return { ok: false, error: "Nombre y teléfono son obligatorios." };
  }

  const ip = await getClientIp();
  if (
    !checkRateLimit(`waitlist:phone:${params.clientPhone.trim()}`, 5, 10 * 60 * 1000) ||
    !checkRateLimit(`waitlist:ip:${ip}`, 20, 10 * 60 * 1000)
  ) {
    return { ok: false, error: "Demasiados intentos, espera unos minutos e inténtalo de nuevo." };
  }

  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, businessId: business.id, active: true },
  });
  if (!service) return { ok: false, error: "Servicio no válido." };

  await prisma.waitlistEntry.create({
    data: {
      businessId: business.id,
      serviceId: service.id,
      staffId: params.staffId,
      day: params.day,
      clientName: params.clientName.trim(),
      clientPhone: params.clientPhone.trim(),
    },
  });

  return { ok: true };
}
