import { Resend } from "resend";
import { formatCOP } from "@/lib/money";

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

export async function sendAccountSetupPin(to: string, pin: string, businessName: string): Promise<SendResult> {
  if (!resend) {
    console.log(`[email:cuenta-nueva] Resend no configurado. PIN para ${to}: ${pin}`);
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Tu cuenta de ${businessName} en Turnify está lista`,
      html: `
        <p>Soporte de Turnify creó tu acceso a <strong>${businessName}</strong>. Usa este código
        para elegir tu contraseña:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${pin}</p>
        <p>Vence en 15 minutos. Si no esperabas este correo, ignóralo.</p>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:cuenta-nueva] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}

export type AppointmentReminderDetails = {
  clientName: string;
  businessName: string;
  serviceName: string;
  startTime: Date;
};

export async function sendAppointmentReminderEmail(
  to: string,
  details: AppointmentReminderDetails
): Promise<SendResult> {
  const dateLabel = details.startTime.toLocaleString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!resend) {
    console.log(`[email:recordatorio] Resend no configurado. Recordatorio para ${to}: ${details.serviceName} el ${dateLabel}`);
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Recordatorio: tu cita en ${details.businessName}`,
      html: `
        <p>Hola ${details.clientName},</p>
        <p>Te recordamos tu cita de <strong>${details.serviceName}</strong> en
        <strong>${details.businessName}</strong> el ${dateLabel}.</p>
        <p>¡Te esperamos!</p>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:recordatorio] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}

export type LowStockDetails = {
  businessName: string;
  productName: string;
  currentStock: number;
  minStock: number;
};

export async function sendLowStockAlert(to: string, details: LowStockDetails): Promise<SendResult> {
  if (!resend) {
    console.log(
      `[email:stock] Resend no configurado. ${details.productName} en ${details.businessName}: quedan ${details.currentStock} (mínimo ${details.minStock})`
    );
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `⚠️ ${details.businessName}: stock bajo de ${details.productName}`,
      html: `
        <p>El producto <strong>${details.productName}</strong> en <strong>${details.businessName}</strong>
        está por agotarse.</p>
        <ul>
          <li><strong>Stock actual:</strong> ${details.currentStock}</li>
          <li><strong>Mínimo configurado:</strong> ${details.minStock}</li>
        </ul>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:stock] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}

export type WeeklyDigestDetails = {
  businessName: string;
  revenue: number;
  appointmentCount: number;
  topServiceName: string | null;
};

export async function sendWeeklyDigestEmail(to: string, details: WeeklyDigestDetails): Promise<SendResult> {
  if (!resend) {
    console.log(
      `[email:resumen] Resend no configurado. Resumen de ${details.businessName}: ${formatCOP(details.revenue)} en ${details.appointmentCount} citas`
    );
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Tu resumen semanal de ${details.businessName}`,
      html: `
        <p>Así te fue la última semana en <strong>${details.businessName}</strong>:</p>
        <ul>
          <li><strong>Ingreso:</strong> ${formatCOP(details.revenue)}</li>
          <li><strong>Citas completadas:</strong> ${details.appointmentCount}</li>
          <li><strong>Servicio más pedido:</strong> ${details.topServiceName ?? "—"}</li>
        </ul>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email:resumen] Error enviando correo:", error);
    return { sent: false, reason: "Error al enviar el correo" };
  }
}

type CashSessionSummaryDetails = {
  businessName: string;
  drawerLabel: string; // nombre del staff o "Caja general"
  openingAmount: number;
  expectedAmount: number;
  countedAmount: number;
  difference: number;
  cardAmount: number;
  transferAmount: number;
  salesCount: number;
  closedByName: string;
  notes: string | null;
  urgent: boolean; // la diferencia superó el umbral configurado del negocio
};

/** Se manda al dueño en CADA cierre de caja, no solo cuando hay una diferencia grande. */
export async function sendCashSessionSummary(
  to: string,
  details: CashSessionSummaryDetails
): Promise<SendResult> {
  const matched = details.difference === 0;
  const sign = details.difference > 0 ? "sobrante" : "faltante";
  const amount = formatCOP(Math.abs(details.difference));
  const total = details.expectedAmount + details.cardAmount + details.transferAmount;
  const statusLine = matched
    ? "El recaudo coincidió."
    : `Hubo un ${sign} de ${amount}${details.urgent ? " — supera el umbral de alerta configurado" : ""}.`;
  const subject = matched
    ? `${details.businessName}: cierre de caja (${details.drawerLabel}) — recaudo coincide`
    : `${details.urgent ? "⚠️ " : ""}${details.businessName}: ${sign} de ${amount} al cerrar caja (${details.drawerLabel})`;

  if (!resend) {
    console.log(`[email:caja] Resend no configurado. Resumen para ${to}: ${details.drawerLabel} — ${statusLine}`);
    return { sent: false, reason: "RESEND_API_KEY no configurado" };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html: `
        <p>${statusLine}</p>
        <ul>
          <li><strong>Caja:</strong> ${details.drawerLabel}</li>
          <li><strong>Ventas en la sesión:</strong> ${details.salesCount}</li>
          <li><strong>Monto inicial:</strong> ${formatCOP(details.openingAmount)}</li>
          <li><strong>Efectivo esperado:</strong> ${formatCOP(details.expectedAmount)}</li>
          <li><strong>Efectivo contado:</strong> ${formatCOP(details.countedAmount)}</li>
          <li><strong>Diferencia en efectivo:</strong> ${details.difference > 0 ? "+" : ""}${formatCOP(details.difference)}</li>
          <li><strong>Tarjeta en persona:</strong> ${formatCOP(details.cardAmount)}</li>
          <li><strong>Transferencias (anticipos/tarjetas de regalo confirmados):</strong> ${formatCOP(details.transferAmount)}</li>
          <li><strong>Total de la sesión:</strong> ${formatCOP(total)}</li>
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
