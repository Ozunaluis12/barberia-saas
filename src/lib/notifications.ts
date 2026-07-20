// Recordatorios de citas. WhatsApp está conectado con Twilio; EMAIL y SMS
// todavía no (imprimen el mensaje en los logs en vez de enviarlo).

export type ReminderChannel = "NONE" | "EMAIL" | "SMS" | "WHATSAPP";

export type ReminderPayload = {
  clientName: string;
  clientPhone: string;
  businessName: string;
  serviceName: string;
  startTime: Date;
};

export type ReminderResult = { sent: boolean; reason?: string };

/** Deja solo dígitos con un "+" adelante; devuelve null si no parece un teléfono real. */
function toE164(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `+${digits}`;
}

async function sendWhatsAppReminder(payload: ReminderPayload): Promise<ReminderResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  const to = toE164(payload.clientPhone);
  const dateLabel = payload.startTime.toLocaleString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  const body = `Hola ${payload.clientName}, te recordamos tu cita de ${payload.serviceName} en ${payload.businessName} el ${dateLabel}.`;

  if (!sid || !token || !from) {
    console.log(`[recordatorio:WHATSAPP] Twilio no configurado. Mensaje para ${payload.clientPhone}: ${body}`);
    return { sent: false, reason: "Twilio no configurado (faltan variables de entorno)." };
  }

  if (!to) {
    return { sent: false, reason: "El teléfono del cliente no parece válido para WhatsApp." };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${from.replace(/^whatsapp:/, "")}`,
        To: `whatsapp:${to}`,
        Body: body,
      }),
    });

    if (!res.ok) {
      console.error("[recordatorio:WHATSAPP] Error de Twilio:", await res.text());
      return { sent: false, reason: "Twilio rechazó el mensaje." };
    }

    return { sent: true };
  } catch (error) {
    console.error("[recordatorio:WHATSAPP] Error de red:", error);
    return { sent: false, reason: "Error de red al contactar Twilio." };
  }
}

export async function sendAppointmentReminder(
  channel: ReminderChannel,
  payload: ReminderPayload
): Promise<ReminderResult> {
  if (channel === "NONE") {
    return { sent: false, reason: "Este negocio no tiene recordatorios activados." };
  }

  if (channel === "WHATSAPP") {
    return sendWhatsAppReminder(payload);
  }

  // TODO: EMAIL (Resend) y SMS (Twilio) todavía no conectados.
  console.log(
    `[recordatorio:${channel}] ${payload.clientName} (${payload.clientPhone}) — ` +
      `${payload.serviceName} en ${payload.businessName} el ${payload.startTime.toISOString()}`
  );
  return { sent: false, reason: `El canal ${channel} todavía no está conectado.` };
}
