"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { applyClientStrike } from "@/lib/clients";

export async function getPublicAppointment(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: true, staff: true, service: true, review: true },
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

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");

  return { ok: true, wasLate, noticeHours };
}
