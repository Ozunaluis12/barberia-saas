"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";

export async function createCoupon(formData: FormData) {
  const session = await requirePermission("catalog");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountTypeInput = String(formData.get("discountType") ?? "PERCENT");
  const discountType = ["PERCENT", "FIXED"].includes(discountTypeInput) ? discountTypeInput : "PERCENT";
  const discountValue = Number(formData.get("discountValue") ?? NaN);
  const maxUsesInput = String(formData.get("maxUses") ?? "").trim();
  const maxUses = maxUsesInput === "" ? null : Number(maxUsesInput);
  const expiresAtInput = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresAtInput ? new Date(`${expiresAtInput}T23:59:59`) : null;

  if (!code) redirect("/dashboard/coupons?error=CODIGO_REQUERIDO");
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    redirect("/dashboard/coupons?error=DESCUENTO_INVALIDO");
  }
  if (discountType === "PERCENT" && discountValue > 100) {
    redirect("/dashboard/coupons?error=DESCUENTO_INVALIDO");
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
    redirect("/dashboard/coupons?error=USOS_INVALIDOS");
  }

  const existing = await prisma.coupon.findFirst({ where: { businessId: session.businessId, code } });
  if (existing) redirect("/dashboard/coupons?error=CODIGO_EN_USO");

  await prisma.coupon.create({
    data: { businessId: session.businessId, code, discountType, discountValue, maxUses, expiresAt },
  });

  revalidatePath("/dashboard/coupons");
  redirect("/dashboard/coupons");
}

export async function toggleCouponActive(couponId: string) {
  const session = await requirePermission("catalog");
  const coupon = await prisma.coupon.findFirst({ where: { id: couponId, businessId: session.businessId } });
  if (!coupon) return;
  await prisma.coupon.update({ where: { id: couponId }, data: { active: !coupon.active } });
  revalidatePath("/dashboard/coupons");
}

export type ValidateCouponResult =
  | { valid: true; discountType: string; discountValue: number }
  | { valid: false; error: string };

/** Validación pública (sin auth) usada por el flujo de reserva. */
export async function validateCoupon(businessSlug: string, code: string): Promise<ValidateCouponResult> {
  const business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business) return { valid: false, error: "Negocio no encontrado." };

  const coupon = await prisma.coupon.findFirst({
    where: { businessId: business.id, code: code.trim().toUpperCase(), active: true },
  });
  if (!coupon) return { valid: false, error: "Ese código no existe o ya no está activo." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "Ese código ya venció." };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "Ese código ya alcanzó su límite de usos." };
  }

  return { valid: true, discountType: coupon.discountType, discountValue: coupon.discountValue };
}
