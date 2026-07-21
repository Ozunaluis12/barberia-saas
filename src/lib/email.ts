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

export type CashDiscrepancyDetails = {
  businessName: string;
  drawerLabel: string; // nombre del staff o "Caja general"
  expectedAmount: number;
  countedAmount: number;
  difference: number;
  closedByName: string;
  notes: string | null;
};

export async function sendCashDiscrepancyAlert(
  to: string,
  details: CashDiscrepancyDetails
): Promise<SendResult> {
  const sign = details.difference > 0 ? "sobrante" : "faltante";
  const amount = Math.abs(details.difference).toFixed(2);

  if (!resend) {
    console.log(
      `[email:caja] Resend no configurado. Alerta para ${to}: ${sign} de $${amount} en ${details.drawerLabel}`
    );
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `⚠️ ${details.businessName}: ${sign} de $${amount} al cerrar caja (${details.drawerLabel})`,
      html: `
        <p>Se cerró una caja con una diferencia mayor al umbral configurado.</p>
        <ul>
          <li><strong>Caja:</strong> ${details.drawerLabel}</li>
          <li><strong>Esperado:</strong> $${details.expectedAmount.toFixed(2)}</li>
          <li><strong>Contado:</strong> $${details.countedAmount.toFixed(2)}</li>
          <li><strong>Diferencia:</strong> ${details.difference > 0 ? "+" : ""}$${details.difference.toFixed(2)} (${sign})</li>
          <li><strong>Cerrada por:</strong> ${details.closedByName}</li>
          <li><strong>Notas:</strong> ${details.notes ?? "(sin notas)"}</li>
        </ul>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:caja] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}
