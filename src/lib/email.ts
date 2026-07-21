import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "Turnify <onboarding@resend.dev>";

export type SendResult = { sent: boolean; reason?: string };

export async function sendPasswordResetPin(to: string, pin: string): Promise<SendResult> {
  if (!resend) {
    console.log(`[email:reset] Resend no configurado. PIN para ${to}: ${pin}`);
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `${pin} es tu código para recuperar tu contraseña de Turnify`,
      html: `
        <p>Usa este código para elegir una nueva contraseña:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${pin}</p>
        <p>Vence en 15 minutos. Si tú no pediste esto, ignora este correo.</p>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:reset] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}
