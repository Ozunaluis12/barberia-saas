"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient, applyClientStrike } from "@/lib/clients";

/** El dueño/personal agrega una cita directa (walk-in) desde el panel. */
export async function createWalkIn(formData: FormData) {
  const session = await requireSession();
  const staffId = String(formData.get("staffId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!staffId || !serviceId || !clientName || !day || !time) return;

  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!service || !staff) return;

  const startTime = combineDayAndTime(day, time);
  const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

  const client = await findOrCreateClient(session.businessId, clientName, clientPhone || "N/A");

  await prisma.appointment.create({
    data: {
      businessId: session.businessId,
      staffId,
      serviceId,
      clientId: client.id,
      clientName,
      clientPhone: clientPhone || "N/A",
      startTime,
      endTime,
      status: "CONFIRMED",
      source: "WALK_IN",
      priceCharged: service.price,
    },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await requireSession();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: session.businessId },
  });
  if (!appt) return;
  await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });

  // El no-show es la señal más fuerte de incumplimiento: cuenta como sanción para el cliente.
  if (status === "NO_SHOW") {
    await applyClientStrike(appt.clientId);
    revalidatePath("/dashboard/clients");
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

export async function markAppointmentPaid(appointmentId: string, paymentMethod: "CASH" | "CARD_IN_PERSON") {
  const session = await requireSession();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: session.businessId },
  });
  if (!appt) return;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentMethod, paymentStatus: "PAID" },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/reports");
}

export async function getWalkInSlots(params: {
  serviceId: string;
  staffId: string;
  day: string;
}) {
  const session = await requireSession();
  return getAvailableSlots({
    businessId: session.businessId,
    serviceId: params.serviceId,
    staffId: params.staffId,
    day: params.day,
  });
}
