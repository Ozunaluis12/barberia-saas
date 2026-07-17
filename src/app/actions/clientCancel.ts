"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getPublicAppointment(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shop: true, barber: true, service: true },
  });
  return appt;
}

export type CancelResult =
  | { ok: true; wasLate: boolean; noticeHours: number }
  | { ok: false; error: string };

/**
 * El cliente cancela su propia cita mediante el enlace que recibió al reservar.
 * Si cancela dentro de la ventana mínima de anticipación configurada por la
 * barbería, se marca como cancelación tardía y suma una sanción al historial
 * del cliente para que los barberos la vean antes de aceptarle otra cita.
 */
export async function cancelAppointmentByClient(appointmentId: string): Promise<CancelResult> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { shop: true },
  });
  if (!appt) return { ok: false, error: "Cita no encontrada." };
  if (appt.status !== "CONFIRMED") {
    return { ok: false, error: "Esta cita ya no está activa." };
  }

  const noticeHours = appt.shop.cancellationNoticeHours;
  const hoursUntilStart = (appt.startTime.getTime() - Date.now()) / (60 * 60 * 1000);
  const wasLate = hoursUntilStart < noticeHours;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", lateCancellation: wasLate },
  });

  if (wasLate) {
    await prisma.client.update({
      where: { id: appt.clientId },
      data: { strikes: { increment: 1 } },
    });
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");

  return { ok: true, wasLate, noticeHours };
}
