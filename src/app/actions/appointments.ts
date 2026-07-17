"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient } from "@/lib/clients";

/** El dueño/staff agrega una cita directa (walk-in) desde el panel. */
export async function createWalkIn(formData: FormData) {
  const session = await requireSession();
  const barberId = String(formData.get("barberId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!barberId || !serviceId || !clientName || !day || !time) return;

  const service = await prisma.service.findFirst({ where: { id: serviceId, shopId: session.shopId } });
  const barber = await prisma.barber.findFirst({ where: { id: barberId, shopId: session.shopId } });
  if (!service || !barber) return;

  const startTime = combineDayAndTime(day, time);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

  const client = await findOrCreateClient(session.shopId, clientName, clientPhone || "N/A");

  await prisma.appointment.create({
    data: {
      shopId: session.shopId,
      barberId,
      serviceId,
      clientId: client.id,
      clientName,
      clientPhone: clientPhone || "N/A",
      startTime,
      endTime,
      status: "CONFIRMED",
      source: "WALK_IN",
    },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await requireSession();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, shopId: session.shopId },
  });
  if (!appt) return;
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });

  // El no-show es la señal más fuerte de incumplimiento: cuenta como sanción para el cliente.
  if (status === "NO_SHOW") {
    await prisma.client.update({
      where: { id: appt.clientId },
      data: { strikes: { increment: 1 } },
    });
    revalidatePath("/dashboard/clients");
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

export async function getWalkInSlots(params: {
  serviceId: string;
  barberId: string;
  day: string;
}) {
  const session = await requireSession();
  return getAvailableSlots({
    shopId: session.shopId,
    serviceId: params.serviceId,
    barberId: params.barberId,
    day: params.day,
  });
}
