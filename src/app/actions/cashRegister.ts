"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { sendCashDiscrepancyAlert } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { getOwnerEmails } from "@/lib/owners";
import { formatCOP } from "@/lib/money";

/**
 * Solo el dueño, o el miembro del roster vinculado a esa caja personal, puede
 * abrirla/cerrarla. La caja general (staffId null) es exclusiva del dueño,
 * porque nadie en particular es responsable de ella.
 */
function canOperateDrawer(session: { role: string; staffId: string | null }, drawerStaffId: string | null): boolean {
  if (session.role === "OWNER") return true;
  if (drawerStaffId === null) return false;
  return session.staffId === drawerStaffId;
}

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
 * Cierra una caja: calcula lo esperado (monto de apertura + pagos en efectivo
 * registrados durante la ventana de la sesión) y lo compara contra lo contado
 * físicamente. La diferencia queda guardada para siempre, no solo mientras la
 * caja está abierta.
 *
 * A propósito, el monto esperado NUNCA se le muestra a quien va a contar
 * antes de que envíe su conteo (ver /dashboard/register) — un conteo "a
 * ciegas" es lo que hace que este control sirva para algo.
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

  const paidInWindow = await prisma.appointment.findMany({
    where: {
      businessId: session.businessId,
      ...(cashSession!.staffId ? { staffId: cashSession!.staffId } : {}),
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      paidAt: { gte: cashSession!.openedAt, lte: closedAt },
    },
    select: { priceCharged: true, depositAmount: true, giftCardRedeemed: true },
  });
  // Ni el anticipo (se cobró por transferencia antes) ni el saldo cubierto
  // con tarjeta de regalo fueron efectivo real entrando a esta caja — solo
  // cuenta lo que de verdad se cobró en efectivo.
  const paidInWindowCashTotal = paidInWindow.reduce(
    (sum, a) => sum + ((a.priceCharged ?? 0) - (a.depositAmount ?? 0) - (a.giftCardRedeemed ?? 0)),
    0
  );

  // Las ventas de producto (Catálogo o Tiendita) no se pueden atribuir a un
  // miembro puntual del roster (Staff), así que solo suman al esperado de la
  // caja general.
  const [productSalesInWindow, storeSalesInWindow] = cashSession!.staffId
    ? [[], []]
    : await Promise.all([
        prisma.productSale.findMany({
          where: {
            businessId: session.businessId,
            paymentMethod: "CASH",
            createdAt: { gte: cashSession!.openedAt, lte: closedAt },
          },
          select: { total: true, giftCardRedeemed: true },
        }),
        prisma.storeSale.findMany({
          where: {
            businessId: session.businessId,
            paymentMethod: "CASH",
            createdAt: { gte: cashSession!.openedAt, lte: closedAt },
          },
          select: { total: true, giftCardRedeemed: true },
        }),
      ]);

  const productSalesCashTotal = productSalesInWindow.reduce(
    (sum, s) => sum + (s.total - (s.giftCardRedeemed ?? 0)),
    0
  );
  const storeSalesCashTotal = storeSalesInWindow.reduce(
    (sum, s) => sum + (s.total - (s.giftCardRedeemed ?? 0)),
    0
  );

  const expectedAmount =
    cashSession!.openingAmount +
    paidInWindowCashTotal +
    productSalesCashTotal +
    storeSalesCashTotal;
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

  if (business && Math.abs(difference) >= business.cashDiscrepancyAlertThreshold) {
    const ownerEmails = await getOwnerEmails(session.organizationId);
    await Promise.all(
      ownerEmails.map((email) =>
        sendCashDiscrepancyAlert(email, {
          businessName: business.name,
          drawerLabel: staff?.name ?? "Caja general",
          expectedAmount,
          countedAmount,
          difference,
          closedByName: closedByUser?.name ?? "—",
          notes: notes || null,
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
  redirect("/dashboard/register");
}
