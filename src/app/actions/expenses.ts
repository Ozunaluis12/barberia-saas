"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";

export async function createExpense(formData: FormData) {
  const session = await requirePermission("reports");
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? NaN);
  const description = String(formData.get("description") ?? "").trim();
  const dateInput = String(formData.get("date") ?? "").trim();

  if (!category) redirect("/dashboard/expenses?error=CATEGORIA_REQUERIDA");
  if (!Number.isFinite(amount) || amount <= 0) redirect("/dashboard/expenses?error=MONTO_INVALIDO");
  if (!dateInput) redirect("/dashboard/expenses?error=FECHA_INVALIDA");
  const date = new Date(`${dateInput}T12:00:00`);
  if (Number.isNaN(date.getTime())) redirect("/dashboard/expenses?error=FECHA_INVALIDA");

  await prisma.expense.create({
    data: { businessId: session.businessId, category, amount, description: description || null, date },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/analytics");
  redirect("/dashboard/expenses");
}

export async function deleteExpense(expenseId: string) {
  const session = await requirePermission("reports");
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, businessId: session.businessId } });
  if (!expense) return;

  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/analytics");
}
