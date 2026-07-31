"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { applyClientStrike } from "@/lib/clients";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";

export async function getPublicAppointment(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: true, staff: true, service: true, review: true, client: true },
  });
  return appt;
}

export type CancelResult =
  | { ok: true; wasLate: boolean; noticeHours: number }
  | { ok: false; error: string };

/**
 * El cliente cancela su propia cita mediante el enlace que recibió al reservar.
 * Si cancela dentro de la ventana mínima de anticipación configurada por el
 * negocio, se marca como cancelación tardía y suma una sanción al historial
 * del cliente para que cualquier miembro del equipo la vea antes de aceptarle
 * otra cita.
 */
export async function cancelAppointmentByClient(appointmentId: string): Promise<CancelResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: true },
  });
  if (!appt) return { ok: false, error: "Cita no encontrada." };
  if (appt.status !== "CONFIRMED") {
    return { ok: false, error: "Esta cita ya no está activa." };
  }
  if (appt.startTime.getTime() <= Date.now()) {
    return { ok: false, error: "Esta cita ya pasó y no se puede cancelar desde aquí." };
  }

  const noticeHours = appt.business.cancellationNoticeHours;
  const hoursUntilStart = (appt.startTime.getTime() - Date.now()) / (60 * 60 * 1000);
  const wasLate = hoursUntilStart < noticeHours;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", lateCancellation: wasLate },
  });

  if (wasLate) {
    await applyClientStrike(appt.clientId);
  }

  // Si la cita se pagó consumiendo una sesión de un paquete, se devuelve al
  // cancelar — si no, el cliente pierde una sesión que sí pagó.
  if (appt.packagePurchaseId) {
    await prisma.clientPackagePurchase.update({
      where: { id: appt.packagePurchaseId },
      data: { sessionsRemaining: { increment: 1 } },
    });
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");

  return { ok: true, wasLate, noticeHours };
}

/** Horarios libres para reprogramar una cita puntual, con el mismo servicio y especialista. */
export async function fetchReschedulableSlots(
  appointmentId: string,
  day: string
): Promise<{ time: string }[]> {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.status !== "CONFIRMED") return [];

  const slots = await getAvailableSlots({
    businessId: appt.businessId,
    serviceId: appt.serviceId,
    staffId: appt.staffId,
    day,
    excludeAppointmentId: appointmentId,
  });
  return slots.map((s) => ({ time: s.time }));
}

export type RescheduleResult = { ok: true; newStartTime: string } | { ok: false; error: string };

/**
 * El cliente mueve su propia cita a otro horario libre, mismo servicio y
 * especialista, mediante el enlace que recibió al reservar. Exige el mismo
 * margen de anticipación que una cancelación (`cancellationNoticeHours`) —
 * si no, cualquiera podría vaciar un horario a último minuto sin que quede
 * registrado como cancelación tardía.
 */
export async function rescheduleAppointmentByClient(
  appointmentId: string,
  newDay: string,
  newTime: string
): Promise<RescheduleResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: true, service: true },
  });
  if (!appt) return { ok: false, error: "Cita no encontrada." };
  if (appt.status !== "CONFIRMED") {
    return { ok: false, error: "Esta cita ya no está activa." };
  }
  if (appt.startTime.getTime() <= Date.now()) {
    return { ok: false, error: "Esta cita ya pasó y no se puede reprogramar desde aquí." };
  }

  const noticeHours = appt.business.cancellationNoticeHours;
  const hoursUntilStart = (appt.startTime.getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursUntilStart < noticeHours) {
    return {
      ok: false,
      error: `Se requiere al menos ${noticeHours} horas de anticipación para reprogramar. Contacta directamente al negocio.`,
    };
  }

  const result = await prisma.$transaction(
    async (tx): Promise<RescheduleResult> => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${appt.businessId})::bigint)`;

      const slots = await getAvailableSlots(
        {
          businessId: appt.businessId,
          serviceId: appt.serviceId,
          staffId: appt.staffId,
          day: newDay,
          excludeAppointmentId: appointmentId,
        },
        tx
      );
      const match = slots.find((s) => s.time === newTime);
      if (!match) {
        return { ok: false, error: "Ese horario ya no está disponible, por favor elige otro." };
      }

      const startTime = combineDayAndTime(newDay, newTime);
      const endTime = new Date(startTime.getTime() + appt.service.durationMinutes * 60000);

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { startTime, endTime, staffId: match.staffId },
      });

      return { ok: true, newStartTime: startTime.toISOString() };
    },
    { timeout: 15000, maxWait: 15000 }
  );

  if (result.ok) {
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
  }

  return result;
}
