"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";

/**
 * Congela el cálculo de comisión de cada staff para un rango de fechas y lo
 * marca como pagado, para no recalcularlo (y pagarlo dos veces) más tarde.
 */
export async function closePayrollPeriod(formData: FormData) {
  const session = await requirePermission("reports");
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!from || !to) redirect("/dashboard/reports?error=RANGO_INVALIDO");

  const periodStart = new Date(`${from}T00:00:00`);
  const periodEnd = new Date(`${to}T23:59:59`);

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: session.businessId,
      status: "COMPLETED",
      startTime: { gte: periodStart, lte: periodEnd },
    },
    include: { staff: true, service: true },
  });

  const byStaff = new Map<
    string,
    { commissionPercent: number | null; revenue: number }
  >();

  for (const a of appointments) {
    const entry = byStaff.get(a.staffId) ?? {
      commissionPercent: a.staff.commissionPercent,
      revenue: 0,
    };
    entry.revenue += a.priceCharged ?? a.service.price;
    byStaff.set(a.staffId, entry);
  }

  const payouts = Array.from(byStaff.entries()).filter(([, r]) => r.revenue > 0);
  if (payouts.length === 0) redirect("/dashboard/reports?error=SIN_DATOS");

  await prisma.payrollPayout.createMany({
    data: payouts.map(([staffId, r]) => ({
      businessId: session.businessId,
      staffId,
      periodStart,
      periodEnd,
      revenue: r.revenue,
      commissionPercent: r.commissionPercent,
      commissionAmount: r.commissionPercent === null ? 0 : r.revenue * (r.commissionPercent / 100),
      paidByUserId: session.userId,
    })),
  });

  revalidatePath("/dashboard/reports");
  redirect(`/dashboard/reports?from=${from}&to=${to}&paid=1`);
}
