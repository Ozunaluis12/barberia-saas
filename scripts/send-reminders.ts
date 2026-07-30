import { prisma } from "../src/lib/db";
import { sendAppointmentReminder, sendWhatsAppMessage, type ReminderChannel } from "../src/lib/notifications";
import { notifyWaitlistForFreedSlot } from "../src/lib/waitlist";

// Se corre cada 15 minutos (ver render.yaml). La ventana de búsqueda coincide
// con ese intervalo para que cada cita reciba su recordatorio una sola vez.
const WINDOW_MINUTES = 15;

/**
 * Le da al cliente un último aviso a mitad de camino del plazo de
 * confirmación, por si no ha enviado el comprobante todavía.
 */
async function remindPendingPayments() {
  const businesses = await prisma.business.findMany({
    where: { advancePaymentEnabled: true },
  });

  let reminded = 0;

  for (const business of businesses) {
    const halfCutoff = new Date(Date.now() - (business.advancePaymentExpirationHours / 2) * 60 * 60 * 1000);
    const fullCutoff = new Date(Date.now() - business.advancePaymentExpirationHours * 60 * 60 * 1000);

    const dueForReminder = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        status: "PENDING_PAYMENT",
        paymentReminderSentAt: null,
        createdAt: { lte: halfCutoff, gt: fullCutoff },
      },
      include: { service: true },
    });

    for (const appt of dueForReminder) {
      await sendWhatsAppMessage(
        appt.clientPhone,
        `Hola ${appt.clientName}, todavía no confirmamos tu pago de ${appt.service.name} en ${business.name}. Si ya pagaste, envía tu comprobante cuanto antes o tu horario podría liberarse.`
      );
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { paymentReminderSentAt: new Date() },
      });
      reminded++;
    }
  }

  console.log(`Recordatorios de pago pendiente: ${reminded}.`);
}

/**
 * Libera automáticamente los horarios reservados con pago anticipado que
 * nadie confirmó dentro del plazo configurado por el negocio — si no, un
 * cliente podría bloquear un horario para siempre sin pagar nunca.
 */
async function expirePendingPayments() {
  const businesses = await prisma.business.findMany({
    where: { advancePaymentEnabled: true },
  });

  let expired = 0;

  for (const business of businesses) {
    const cutoff = new Date(Date.now() - business.advancePaymentExpirationHours * 60 * 60 * 1000);
    const stale = await prisma.appointment.findMany({
      where: { businessId: business.id, status: "PENDING_PAYMENT", createdAt: { lt: cutoff } },
    });

    for (const appt of stale) {
      await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED" } });
      await notifyWaitlistForFreedSlot({
        businessId: appt.businessId,
        serviceId: appt.serviceId,
        staffId: appt.staffId,
        day: appt.startTime.toISOString().slice(0, 10),
      });
      expired++;
    }
  }

  console.log(`Pagos pendientes expirados: ${expired}.`);
}

async function main() {
  await remindPendingPayments();
  await expirePendingPayments();

  const businesses = await prisma.business.findMany({
    where: { reminderChannel: { not: "NONE" } },
  });

  let sent = 0;
  let skipped = 0;

  for (const business of businesses) {
    const windowStart = new Date(Date.now() + business.reminderHoursBefore * 60 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + WINDOW_MINUTES * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        status: "CONFIRMED",
        reminderSentAt: null,
        startTime: { gte: windowStart, lt: windowEnd },
      },
      include: { service: true },
    });

    for (const appt of appointments) {
      const result = await sendAppointmentReminder(business.reminderChannel as ReminderChannel, {
        clientName: appt.clientName,
        clientPhone: appt.clientPhone,
        clientEmail: appt.clientEmail,
        businessName: business.name,
        serviceName: appt.service.name,
        startTime: appt.startTime,
      });

      if (result.sent) {
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } else {
        console.log(`No se recordó a ${appt.clientName} (cita ${appt.id}): ${result.reason}`);
        skipped++;
      }
    }
  }

  console.log(`Recordatorios: ${sent} enviados, ${skipped} omitidos/fallidos.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
