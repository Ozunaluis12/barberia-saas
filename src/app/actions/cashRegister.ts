"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

/** Abre una caja: por empleado (staffId) o general (staffId vacío/null). */
export async function openCashSession(formData: FormData) {
  const session = await requireSession();
  const staffIdInput = String(formData.get("staffId") ?? "").trim();
  const staffId = staffIdInput === "" ? null : staffIdInput;
  const openingAmount = Math.max(0, Number(formData.get("openingAmount") ?? 0));

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

  revalidatePath("/dashboard/register");
  redirect("/dashboard/register");
}

/**
 * Cierra una caja: calcula lo esperado (monto de apertura + pagos en efectivo
 * registrados durante la ventana de la sesión) y lo compara contra lo contado
 * físicamente. La diferencia queda guardada para siempre, no solo mientras la
 * caja está abierta.
 */
export async function closeCashSession(sessionId: string, formData: FormData) {
  const session = await requireSession();
  const cashSession = await prisma.cashSession.findFirst({
    where: { id: sessionId, businessId: session.businessId, status: "OPEN" },
  });
  if (!cashSession) redirect("/dashboard/register?error=CAJA_NO_ENCONTRADA");

  const countedAmount = Math.max(0, Number(formData.get("countedAmount") ?? 0));
  const notes = String(formData.get("notes") ?? "").trim();
  const closedAt = new Date();

  const paidInWindow = await prisma.appointment.aggregate({
    where: {
      businessId: session.businessId,
      ...(cashSession!.staffId ? { staffId: cashSession!.staffId } : {}),
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      paidAt: { gte: cashSession!.openedAt, lte: closedAt },
    },
    _sum: { priceCharged: true },
  });

  const expectedAmount = cashSession!.openingAmount + (paidInWindow._sum.priceCharged ?? 0);
  const difference = countedAmount - expectedAmount;

  await prisma.cashSession.update({
    where: { id: sessionId },
    data: {
      countedAmount,
      expectedAmount,
      difference,
      notes: notes || null,
      status: "CLOSED",
      closedAt,
    },
  });

  revalidatePath("/dashboard/register");
  redirect("/dashboard/register");
}
