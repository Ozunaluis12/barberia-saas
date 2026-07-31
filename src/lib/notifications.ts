// Recordatorios de citas. WhatsApp está conectado con Twilio, EMAIL con
// Resend; SMS todavía no (imprime el mensaje en los logs en vez de enviarlo).
// Un negocio puede activar varios canales a la vez — se manda por todos los
// que tenga activos, no solo uno.

import { sendAppointmentReminderEmail } from "@/lib/email";

export type ReminderChannel = "EMAIL" | "SMS" | "WHATSAPP";

export type ReminderPayload = {
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  businessName: string;
  serviceName: string;
  startTime: Date;
};

export type ReminderResult = { sent: boolean; reason?: string };

/** Deja solo dígitos con un "+" adelante; devuelve null si no parece un teléfono real. */
export function toE164(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `+${digits}`;
}

/** Envío genérico de WhatsApp vía Twilio, reutilizado por recordatorios, lista de espera y difusión masiva. */
export async function sendWhatsAppMessage(phone: string, body: string): Promise<ReminderResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  const to = toE164(phone);

  if (!sid || !token || !from) {
    console.log(`[whatsapp] Twilio no configurado. Mensaje para ${phone}: ${body}`);
    return { sent: false, reason: "Twilio no configurado (faltan variables de entorno)." };
  }

  if (!to) {
    return { sent: false, reason: "El teléfono no parece válido para WhatsApp." };
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
      console.error("[whatsapp] Error de Twilio:", await res.text());
      return { sent: false, reason: "Twilio rechazó el mensaje." };
    }

    return { sent: true };
  } catch (error) {
    console.error("[whatsapp] Error de red:", error);
    return { sent: false, reason: "Error de red al contactar Twilio." };
  }
}

function buildReminderBody(payload: ReminderPayload): string {
  const dateLabel = payload.startTime.toLocaleString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Hola ${payload.clientName}, te recordamos tu cita de ${payload.serviceName} en ${payload.businessName} el ${dateLabel}.`;
}

export async function sendAppointmentReminder(
  channel: ReminderChannel,
  payload: ReminderPayload
): Promise<ReminderResult> {
  if (channel === "WHATSAPP") {
    return sendWhatsAppMessage(payload.clientPhone, buildReminderBody(payload));
  }

  if (channel === "EMAIL") {
    if (!payload.clientEmail) {
      return { sent: false, reason: "El cliente no dejó correo." };
    }
    return sendAppointmentReminderEmail(payload.clientEmail, {
      clientName: payload.clientName,
      businessName: payload.businessName,
      serviceName: payload.serviceName,
      startTime: payload.startTime,
    });
  }

  // TODO: SMS (Twilio) todavía no conectado.
  console.log(
    `[recordatorio:${channel}] ${payload.clientName} (${payload.clientPhone}) — ` +
      `${payload.serviceName} en ${payload.businessName} el ${payload.startTime.toISOString()}`
  );
  return { sent: false, reason: `El canal ${channel} todavía no está conectado.` };
}

/**
 * Manda el recordatorio por todos los canales que el negocio tenga activos a
 * la vez (ej. WhatsApp y correo juntos), no solo por uno. La cita se
 * considera "recordada" si al menos un canal lo logró.
 */
export async function sendAppointmentReminders(
  channels: ReminderChannel[],
  payload: ReminderPayload
): Promise<{ channel: ReminderChannel; result: ReminderResult }[]> {
  return Promise.all(
    channels.map(async (channel) => ({ channel, result: await sendAppointmentReminder(channel, payload) }))
  );
}
