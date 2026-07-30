import { prisma } from "../src/lib/db";
import { sendAppointmentReminder, type ReminderChannel } from "../src/lib/notifications";
import { notifyWaitlistForFreedSlot } from "../src/lib/waitlist";

// Se corre cada 15 minutos (ver render.yaml). La ventana de búsqueda coincide
// con ese intervalo para que cada cita reciba su recordatorio una sola vez.
const WINDOW_MINUTES = 15;

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
