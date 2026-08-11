"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { uploadImage } from "@/lib/images";
import { sendLowStockAlert } from "@/lib/email";
import { getOwnerEmails } from "@/lib/owners";
import { assignReceiptNumber } from "@/lib/receipts";
import { resolveGiftCardRedemption } from "@/app/actions/giftCards";

async function requireStoreEnabled(session: { businessId: string }) {
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business?.storeEnabled) redirect("/dashboard");
  return business;
}

type ParsedStoreItem =
  | { error: "NOMBRE_REQUERIDO" | "PRECIO_INVALIDO" | "COSTO_INVALIDO" | "STOCK_INVALIDO" | "MINSTOCK_INVALIDO" }
  | {
      data: {
        name: string;
        category: string | null;
        description: string | null;
        price: number;
        costPrice: number | null;
        stock: number | null;
        minStock: number | null;
      };
    };

function parseStoreItemInput(formData: FormData): ParsedStoreItem {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? NaN);
  const costPriceInput = String(formData.get("costPrice") ?? "").trim();
  const stockInput = String(formData.get("stock") ?? "").trim();
  const minStockInput = String(formData.get("minStock") ?? "").trim();

  if (!name) return { error: "NOMBRE_REQUERIDO" };
  if (!Number.isFinite(price) || price < 0) return { error: "PRECIO_INVALIDO" };

  let costPrice: number | null = null;
  if (costPriceInput !== "") {
    const parsedCost = Number(costPriceInput);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) return { error: "COSTO_INVALIDO" };
    costPrice = parsedCost;
  }

  let stock: number | null = null;
  if (stockInput !== "") {
    const parsedStock = Number(stockInput);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) return { error: "STOCK_INVALIDO" };
    stock = parsedStock;
  }

  let minStock: number | null = null;
  if (minStockInput !== "") {
    const parsedMinStock = Number(minStockInput);
    if (!Number.isInteger(parsedMinStock) || parsedMinStock < 0) return { error: "MINSTOCK_INVALIDO" };
    minStock = parsedMinStock;
  }

  return { data: { name, category: category || null, description: description || null, price, costPrice, stock, minStock } };
}

export async function createStoreItem(formData: FormData) {
  const session = await requirePermission("catalog");
  await requireStoreEnabled(session);
  const parsed = parseStoreItemInput(formData);
  if ("error" in parsed) redirect(`/dashboard/store?error=${parsed.error}`);

  const photo = formData.get("photo");
  const imageUrl = photo instanceof File ? await uploadImage(photo, "store") : null;

  await prisma.storeItem.create({ data: { businessId: session.businessId, imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/store");
  redirect("/dashboard/store");
}

export async function updateStoreItem(itemId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  await requireStoreEnabled(session);
  const item = await prisma.storeItem.findFirst({ where: { id: itemId, businessId: session.businessId } });
  if (!item) redirect("/dashboard/store?error=NO_ENCONTRADO");

  const parsed = parseStoreItemInput(formData);
  if ("error" in parsed) redirect(`/dashboard/store/${itemId}?error=${parsed.error}`);

  const photo = formData.get("photo");
  const uploadedUrl = photo instanceof File ? await uploadImage(photo, "store") : null;
  const imageUrl = uploadedUrl ?? item!.imageUrl;

  await prisma.storeItem.update({ where: { id: itemId }, data: { imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/store");
  revalidatePath(`/dashboard/store/${itemId}`);
  redirect("/dashboard/store");
}

export async function toggleStoreItemActive(itemId: string) {
  const session = await requirePermission("catalog");
  await requireStoreEnabled(session);
  const item = await prisma.storeItem.findFirst({ where: { id: itemId, businessId: session.businessId } });
  if (!item) return;
  await prisma.storeItem.update({ where: { id: itemId }, data: { active: !item.active } });
  revalidatePath("/dashboard/store");
}

export async function sellStoreItem(itemId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  await requireStoreEnabled(session);
  const item = await prisma.storeItem.findFirst({ where: { id: itemId, businessId: session.businessId } });
  if (!item) redirect("/dashboard/store?error=NO_ENCONTRADO");

  const quantity = Number(formData.get("quantity") ?? NaN);
  const paymentMethodInput = String(formData.get("paymentMethod") ?? "CASH");
  const paymentMethod = ["CASH", "CARD_IN_PERSON"].includes(paymentMethodInput) ? paymentMethodInput : "CASH";

  if (!Number.isInteger(quantity) || quantity <= 0) {
    redirect(`/dashboard/store?error=CANTIDAD_INVALIDA`);
  }
  if (item!.stock !== null && quantity > item!.stock) {
    redirect(`/dashboard/store?error=STOCK_INSUFICIENTE`);
  }

  const total = item!.price * quantity;
  const giftCardCodeInput = String(formData.get("giftCardCode") ?? "").trim().toUpperCase();
  let giftCardId: string | null = null;
  let giftCardRedeemed: number | null = null;
  if (giftCardCodeInput) {
    const resolution = await resolveGiftCardRedemption(session.businessId, giftCardCodeInput, total);
    if (!resolution.ok) redirect(`/dashboard/store?error=${resolution.error}`);
    giftCardId = resolution.giftCardId;
    giftCardRedeemed = resolution.amount;
  }

  const receiptNumber = await assignReceiptNumber(session.businessId);

  await prisma.$transaction([
    ...(item!.stock !== null
      ? [prisma.storeItem.update({ where: { id: itemId }, data: { stock: { decrement: quantity } } })]
      : []),
    ...(giftCardId
      ? [prisma.giftCard.update({ where: { id: giftCardId }, data: { balance: { decrement: giftCardRedeemed! } } })]
      : []),
    prisma.storeSale.create({
      data: {
        storeItemId: itemId,
        businessId: session.businessId,
        quantity,
        unitPrice: item!.price,
        unitCost: item!.costPrice,
        total,
        paymentMethod,
        soldByUserId: session.userId,
        receiptNumber,
        giftCardCode: giftCardId ? giftCardCodeInput : null,
        giftCardRedeemed,
      },
    }),
  ]);

  if (item!.stock !== null && item!.minStock !== null) {
    const newStock = item!.stock - quantity;
    if (newStock <= item!.minStock) {
      const business = await prisma.business.findUnique({ where: { id: session.businessId } });
      if (business) {
        const ownerEmails = await getOwnerEmails(session.organizationId);
        await Promise.all(
          ownerEmails.map((email) =>
            sendLowStockAlert(email, {
              businessName: business.name,
              productName: item!.name,
              currentStock: newStock,
              minStock: item!.minStock!,
            })
          )
        );
      }
    }
  }

  revalidatePath("/dashboard/store");
  revalidatePath("/dashboard/register");
  redirect("/dashboard/store");
}

export async function restockStoreItem(itemId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  await requireStoreEnabled(session);
  const item = await prisma.storeItem.findFirst({ where: { id: itemId, businessId: session.businessId } });
  if (!item) redirect("/dashboard/store?error=NO_ENCONTRADO");

  const quantity = Number(formData.get("quantity") ?? NaN);
  const costPriceInput = String(formData.get("costPrice") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isInteger(quantity) || quantity <= 0) {
    redirect(`/dashboard/store/${itemId}?error=CANTIDAD_INVALIDA`);
  }

  let costPrice: number | null = null;
  if (costPriceInput !== "") {
    const parsedCost = Number(costPriceInput);
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      redirect(`/dashboard/store/${itemId}?error=COSTO_INVALIDO`);
    }
    costPrice = parsedCost;
  }

  await prisma.$transaction([
    prisma.storeItem.update({
      where: { id: itemId },
      data: {
        stock: { increment: quantity },
        ...(costPrice !== null ? { costPrice } : {}),
      },
    }),
    prisma.storeRestock.create({
      data: {
        storeItemId: itemId,
        businessId: session.businessId,
        quantity,
        costPrice,
        note: note || null,
        restockedByUserId: session.userId,
      },
    }),
  ]);

  revalidatePath("/dashboard/store");
  revalidatePath(`/dashboard/store/${itemId}`);
  redirect(`/dashboard/store/${itemId}`);
}
