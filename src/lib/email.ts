import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "Turnify <onboarding@resend.dev>";

export type SendResult = { sent: boolean; reason?: string };

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendResult> {
  if (!resend) {
    console.log(`[email:reset] Resend no configurado. Enlace para ${to}: ${resetUrl}`);
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Recupera tu contraseña de Turnify",
      html: `
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}">Haz clic aquí para elegir una nueva contraseña</a></p>
        <p>Este enlace expira en 1 hora. Si tú no pediste esto, ignora este correo.</p>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:reset] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}
