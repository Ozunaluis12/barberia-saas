"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { sendCashSessionSummary } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { getOwnerEmails } from "@/lib/owners";
import { formatCOP } from "@/lib/money";
import { canOperateDrawer, getSessionMovements } from "@/lib/cashSession";

/** Abre una caja: por empleado (staffId) o general (staffId vacío/null). */
export async function openCashSession(formData: FormData) {
  const session = await requireSession();
  const staffIdInput = String(formData.get("staffId") ?? "").trim();
  const staffId = staffIdInput === "" ? null : staffIdInput;
  const openingAmount = Math.max(0, Number(formData.get("openingAmount") ?? 0));

  if (!canOperateDrawer(session, staffId)) {
    redirect("/dashboard/register?error=SIN_PERMISO");
  }

  const existing = await prisma.cashSession.findFirst({
    where: { businessId: session.businessId, staffId, status: "OPEN" },
  });
  if (existing) redirect("/dashboard/register?error=CAJA_YA_ABIERTA");

  await prisma.cashSession.create({
    data: {
      businessId: session.businessId,
      staffId,
      openedByUserId: session.userId,
      openingAmount,
    },
  });

  await logAudit(session, "cash.opened", `Monto inicial: ${formatCOP(openingAmount)}`);

  revalidatePath("/dashboard/register");
  redirect("/dashboard/register");
}

/**
 * Cierra una caja: calcula lo esperado en efectivo (monto de apertura + ventas
 * en efectivo durante la ventana de la sesión) y lo compara contra lo contado
 * físicamente. La diferencia queda guardada para siempre. También calcula el
 * total en tarjeta (confiado del sistema, sin conteo a ciegas — es trazable).
 *
 * A propósito, el monto esperado NUNCA se le muestra a quien va a contar
 * antes de que envíe su conteo — un conteo "a ciegas" es lo que hace que este
 * control sirva para algo. La revelación (recaudado vs. esperado, por caja)
 * ocurre recién en la página de detalle a la que se redirige tras cerrar.
 */
export async function closeCashSession(sessionId: string, formData: FormData) {
  const session = await requireSession();
  const cashSession = await prisma.cashSession.findFirst({
    where: { id: sessionId, businessId: session.businessId, status: "OPEN" },
  });
  if (!cashSession) redirect("/dashboard/register?error=CAJA_NO_ENCONTRADA");

  if (!canOperateDrawer(session, cashSession!.staffId)) {
    redirect("/dashboard/register?error=SIN_PERMISO");
  }

  const countedAmount = Math.max(0, Number(formData.get("countedAmount") ?? 0));
  const notes = String(formData.get("notes") ?? "").trim();
  const closedAt = new Date();

  const { cashTotal, cardTotal, transferTotal, salesCount } = await getSessionMovements(cashSession!, closedAt);
  const expectedAmount = cashSession!.openingAmount + cashTotal;
  const difference = countedAmount - expectedAmount;

  // Si no cuadra, exigimos una explicación — no se puede cerrar en silencio.
  if (difference !== 0 && !notes) {
    redirect("/dashboard/register?error=NOTAS_REQUERIDAS");
  }

  const [, business, staff, closedByUser] = await Promise.all([
    prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        countedAmount,
        expectedAmount,
        difference,
        cardAmount: cardTotal,
        transferAmount: transferTotal,
        notes: notes || null,
        status: "CLOSED",
        closedAt,
        closedByUserId: session.userId,
      },
    }),
    prisma.business.findUnique({ where: { id: session.businessId } }),
    cashSession!.staffId ? prisma.staff.findUnique({ where: { id: cashSession!.staffId } }) : null,
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);

  if (business) {
    const overThreshold = Math.abs(difference) >= business.cashDiscrepancyAlertThreshold;
    const ownerEmails = await getOwnerEmails(session.organizationId);
    await Promise.all(
      ownerEmails.map((email) =>
        sendCashSessionSummary(email, {
          businessName: business.name,
          drawerLabel: staff?.name ?? "Caja general",
          openingAmount: cashSession!.openingAmount,
          expectedAmount,
          countedAmount,
          difference,
          cardAmount: cardTotal,
          transferAmount: transferTotal,
          salesCount,
          closedByName: closedByUser?.name ?? "—",
          notes: notes || null,
          urgent: overThreshold,
        })
      )
    );
  }

  await logAudit(
    session,
    "cash.closed",
    `${staff?.name ?? "Caja general"}: esperado ${formatCOP(expectedAmount)}, contado ${formatCOP(countedAmount)}, diferencia ${formatCOP(difference)}`
  );

  revalidatePath("/dashboard/register");
  redirect(`/dashboard/register/${sessionId}`);
}
