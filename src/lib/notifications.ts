// Punto de extensión para recordatorios de citas. Todavía no está conectado a un
// proveedor real (Twilio, WhatsApp Business API, Resend, etc.) — cuando se tenga
// una cuenta y credenciales, este archivo es el único lugar que hay que tocar
// para que los recordatorios empiecen a enviarse de verdad.

export type ReminderChannel = "NONE" | "EMAIL" | "SMS" | "WHATSAPP";

export type ReminderPayload = {
  clientName: string;
  clientPhone: string;
  businessName: string;
  serviceName: string;
  startTime: Date;
};

export async function sendAppointmentReminder(
  channel: ReminderChannel,
  payload: ReminderPayload
): Promise<{ sent: boolean; reason?: string }> {
  if (channel === "NONE") {
    return { sent: false, reason: "Este negocio no tiene recordatorios activados." };
  }

  // TODO: integrar un proveedor real por canal:
  // - EMAIL: Resend / SendGrid
  // - SMS: Twilio
  // - WHATSAPP: WhatsApp Business API / Twilio
  console.log(
    `[recordatorio:${channel}] ${payload.clientName} (${payload.clientPhone}) — ` +
      `${payload.serviceName} en ${payload.businessName} el ${payload.startTime.toISOString()}`
  );

  return { sent: false, reason: "Proveedor de notificaciones no configurado todavía." };
}
