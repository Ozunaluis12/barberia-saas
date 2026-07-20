import { prisma } from "../src/lib/db";
import { sendAppointmentReminder, type ReminderChannel } from "../src/lib/notifications";

// Se corre cada 15 minutos (ver render.yaml). La ventana de búsqueda coincide
// con ese intervalo para que cada cita reciba su recordatorio una sola vez.
const WINDOW_MINUTES = 15;

async function main() {
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
