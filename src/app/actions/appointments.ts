"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { getAvailableSlots, combineDayAndTime } from "@/lib/availability";
import { findOrCreateClient, applyClientStrike } from "@/lib/clients";
import { sendWhatsAppMessage } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { assignReceiptNumber } from "@/lib/receipts";
import { formatCOP } from "@/lib/money";

export type CreateWalkInResult = { ok: true } | { ok: false; error: string };

/** El dueño/personal agrega una cita directa (walk-in) desde el panel. */
export async function createWalkIn(formData: FormData): Promise<CreateWalkInResult> {
  const session = await requireSession();
  const staffId = String(formData.get("staffId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const day = String(formData.get("day") ?? "");
  const time = String(formData.get("time") ?? "");
  const packagePurchaseId = String(formData.get("packagePurchaseId") ?? "").trim() || null;

  if (!staffId || !serviceId || !clientName || !day || !time) {
    return { ok: false, error: "Faltan datos: elige servicio, persona y horario." };
  }

  const service = await prisma.service.findFirst({ where: { id: serviceId, businessId: session.businessId } });
  const staff = await prisma.staff.findFirst({ where: { id: staffId, businessId: session.businessId } });
  if (!service || !staff) return { ok: false, error: "Servicio o persona no válidos." };

  const client = await findOrCreateClient(session.organizationId, clientName, clientPhone || "N/A", clientEmail);

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

      // Si el staff eligió consumir una sesión de un paquete prepagado, se
      // vuelve a validar aquí adentro (nunca se confía en lo que mandó el
      // formulario) antes de descontar el saldo y cobrar $0. Si el paquete
      // ya no tiene saldo (por ejemplo, alguien más se adelantó con la
      // última sesión), se rechaza en vez de cobrar de más en silencio —
      // el staff pidió explícitamente usar el paquete.
      let usedPackage: { id: string } | null = null;
      if (packagePurchaseId) {
        const purchase = await tx.clientPackagePurchase.findFirst({
          where: {
            id: packagePurchaseId,
            businessId: session.businessId,
            clientId: client.id,
            sessionsRemaining: { gt: 0 },
            servicePackage: { serviceId },
          },
        });
        if (!purchase) {
          return {
            ok: false,
            error: "El paquete ya no tiene sesiones disponibles. Quita la casilla para cobrar el servicio.",
          };
        }
        await tx.clientPackagePurchase.update({
          where: { id: purchase.id },
          data: { sessionsRemaining: { decrement: 1 } },
        });
        usedPackage = purchase;
      }

      await tx.appointment.create({
        data: {
          businessId: session.businessId,
          staffId,
          serviceId,
          clientId: client.id,
          clientName,
          clientPhone: clientPhone || "N/A",
          clientEmail: clientEmail || null,
          startTime,
          endTime,
          status: "CONFIRMED",
          source: "WALK_IN",
          priceCharged: usedPackage ? 0 : service.price,
          packagePurchaseId: usedPackage?.id ?? null,
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
    // Si la cita se pagó consumiendo una sesión de un paquete, se devuelve al
    // cancelar — si no, el cliente pierde una sesión que sí pagó.
    if (appt.packagePurchaseId) {
      await prisma.clientPackagePurchase.update({
        where: { id: appt.packagePurchaseId },
        data: { sessionsRemaining: { increment: 1 } },
      });
    }
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

  // El comprobante confirma la SEÑA, no el precio completo — si queda un
  // saldo, la cita pasa a "pago parcial" en vez de "pagada", para que el
  // negocio sepa que todavía falta cobrar el resto en persona.
  const remainder = (appt.priceCharged ?? appt.service.price) - (appt.depositAmount ?? 0);
  const fullyPaid = appt.depositAmount === null || remainder <= 0;

  const receiptNumber = fullyPaid ? await assignReceiptNumber(session.businessId) : appt.receiptNumber;
  const confirmedAt = new Date();
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CONFIRMED",
      paymentStatus: fullyPaid ? "PAID" : "PARTIALLY_PAID",
      paidAt: confirmedAt,
      receiptNumber,
      depositConfirmedAt: confirmedAt,
      depositConfirmedByUserId: session.userId,
    },
  });

  await sendWhatsAppMessage(
    appt.clientPhone,
    fullyPaid
      ? `Hola ${appt.clientName}, confirmamos tu pago: tu cita de ${appt.service.name} en ${appt.business.name} el ${appt.startTime.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })} a las ${appt.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} quedó agendada. ¡Te esperamos!`
      : `Hola ${appt.clientName}, confirmamos tu anticipo: tu cita de ${appt.service.name} en ${appt.business.name} el ${appt.startTime.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })} a las ${appt.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} quedó agendada. Falta un saldo de ${formatCOP(remainder)} que se cobra el día de tu cita.`
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

  const receiptNumber = appt.receiptNumber ?? (await assignReceiptNumber(session.businessId));
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentMethod, paymentStatus: "PAID", paidAt: new Date(), receiptNumber },
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
    data: { paymentStatus: "REFUNDED", refundedAt: new Date(), refundReason: reason, refundedByUserId: session.userId },
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
