"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient, applyClientStrike } from "@/lib/clients";
import { notifyWaitlistForFreedSlot } from "@/lib/waitlist";
import { sendWhatsAppMessage } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export type CreateWalkInResult = { ok: true } | { ok: false; error: string };

/** El dueño/personal agrega una cita directa (walk-in) desde el panel. */
export async function createWalkIn(formData: FormData): Promise<CreateWalkInResult> {
  const session = await requireSession();
  const staffId = String(formData.get("staffId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!staffId || !serviceId || !clientName || !day || !time) {
    return { ok: false, error: "Faltan datos: elige servicio, persona y horario." };
  }

  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!service || !staff) return { ok: false, error: "Servicio o persona no válidos." };

  const client = await findOrCreateClient(session.organizationId, clientName, clientPhone || "N/A");

  // Mismo lock que en la reserva pública: revalida que el hueco siga libre antes de
  // insertar, por si dos personas del equipo registran una cita al mismo tiempo.
  const result = await prisma.$transaction(
    async (tx): Promise<CreateWalkInResult> => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.businessId})::bigint)`;

      const slots = await getAvailableSlots(
        { businessId: session.businessId, serviceId, staffId, day },
        tx
      );
      if (!slots.some((s) => s.time === time)) {
        return { ok: false, error: "Ese horario ya no está disponible, elige otro." };
      }

      const startTime = combineDayAndTime(day, time);
      const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

      await tx.appointment.create({
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

      return { ok: true };
    },
    { timeout: 15000, maxWait: 15000 }
  );

  if (result.ok) {
    revalidatePath("/dashboard/appointments");
    revalidatePath("/dashboard");
  }

  return result;
}

const APPOINTMENT_STATUSES = ["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  if (!APPOINTMENT_STATUSES.includes(status)) return;

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

  if (status === "COMPLETED") {
    const business = await prisma.business.findUnique({ where: { id: session.businessId } });
    if (business?.loyaltyEnabled) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: { loyaltyPoints: { increment: business.loyaltyPointsPerVisit } },
      });
      revalidatePath("/dashboard/clients");
    }
  }

  if (status === "CANCELLED") {
    await notifyWaitlistForFreedSlot({
      businessId: appt.businessId,
      serviceId: appt.serviceId,
      staffId: appt.staffId,
      day: appt.startTime.toISOString().slice(0, 10),
    });
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

/** El negocio confirma que recibió el comprobante de un pago anticipado (transferencia/QR/Bre-B). */
export async function confirmAdvancePayment(appointmentId: string) {
  const session = await requireSession();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: session.businessId, status: "PENDING_PAYMENT" },
    include: { business: true, service: true },
  });
  if (!appt) return;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CONFIRMED", paymentStatus: "PAID", paidAt: new Date() },
  });

  await sendWhatsAppMessage(
    appt.clientPhone,
    `Hola ${appt.clientName}, confirmamos tu pago: tu cita de ${appt.service.name} en ${appt.business.name} el ${appt.startTime.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })} a las ${appt.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} quedó agendada. ¡Te esperamos!`
  );

  await logAudit(session, "payment.confirmed", `${appt.clientName} — ${appt.service.name}`);

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

/** El negocio rechaza un pago anticipado (no llegó el comprobante o no coincide) — libera el horario. */
export async function rejectAdvancePayment(appointmentId: string) {
  const session = await requireSession();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: session.businessId, status: "PENDING_PAYMENT" },
    include: { business: true, service: true },
  });
  if (!appt) return;

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "CANCELLED" } });

  await sendWhatsAppMessage(
    appt.clientPhone,
    `Hola ${appt.clientName}, no pudimos confirmar tu pago para la cita de ${appt.service.name} en ${appt.business.name}, así que liberamos ese horario. Si fue un error, escríbenos o vuelve a reservar.`
  );

  await notifyWaitlistForFreedSlot({
    businessId: appt.businessId,
    serviceId: appt.serviceId,
    staffId: appt.staffId,
    day: appt.startTime.toISOString().slice(0, 10),
  });

  await logAudit(session, "payment.rejected", `${appt.clientName} — ${appt.service.name}`);

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

  // El efectivo solo se puede marcar mientras hay una caja abierta que lo vaya a
  // contabilizar — si no, un empleado podría cobrar en efectivo y esperar a
  // marcarlo hasta después de cerrar su caja, y ese dinero nunca aparecería
  // como faltante en ningún cierre.
  if (paymentMethod === "CASH") {
    const openDrawer = await prisma.cashSession.findFirst({
      where: {
        businessId: session.businessId,
        status: "OPEN",
        OR: [{ staffId: null }, { staffId: appt.staffId }],
      },
    });
    if (!openDrawer) {
      redirect("/dashboard/appointments?error=CAJA_CERRADA");
    }
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentMethod, paymentStatus: "PAID", paidAt: new Date() },
  });

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/register");
}

/** Reembolsa una cita ya pagada — exige un motivo, no se puede cerrar en silencio. */
export async function refundAppointmentPayment(appointmentId: string, formData: FormData) {
  const session = await requireSession();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId: session.businessId, paymentStatus: "PAID" },
  });
  if (!appt) return;

  const reason = String(formData.get("refundReason") ?? "").trim();
  if (!reason) {
    redirect("/dashboard/appointments?error=MOTIVO_REQUERIDO");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: "REFUNDED", refundedAt: new Date(), refundReason: reason },
  });

  await logAudit(session, "payment.refunded", `${appt.clientName}: ${reason}`);

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/analytics");
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
