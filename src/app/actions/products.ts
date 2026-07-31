"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/guard";
import { uploadImage } from "@/lib/images";
import { sendLowStockAlert } from "@/lib/email";
import { getOwnerEmails } from "@/lib/owners";
import { assignReceiptNumber } from "@/lib/receipts";

type ParsedProduct =
  | { error: "NOMBRE_REQUERIDO" | "PRECIO_INVALIDO" | "STOCK_INVALIDO" | "MINSTOCK_INVALIDO" }
  | {
      data: {
        name: string;
        description: string | null;
        price: number;
        stock: number | null;
        minStock: number | null;
      };
    };

function parseProductInput(formData: FormData): ParsedProduct {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price") ?? NaN);
  const stockInput = String(formData.get("stock") ?? "").trim();
  const minStockInput = String(formData.get("minStock") ?? "").trim();

  if (!name) return { error: "NOMBRE_REQUERIDO" };
  if (!Number.isFinite(price) || price < 0) return { error: "PRECIO_INVALIDO" };

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

  return { data: { name, description: description || null, price, stock, minStock } };
}

export async function createProduct(formData: FormData) {
  const session = await requirePermission("catalog");
  const parsed = parseProductInput(formData);
  if ("error" in parsed) redirect(`/dashboard/catalog?error=${parsed.error}`);

  const photo = formData.get("photo");
  const imageUrl = photo instanceof File ? await uploadImage(photo, "products") : null;

  await prisma.product.create({ data: { businessId: session.businessId, imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: session.businessId } });
  if (!product) redirect("/dashboard/catalog?error=NO_ENCONTRADO");

  const parsed = parseProductInput(formData);
  if ("error" in parsed) redirect(`/dashboard/catalog/${productId}?error=${parsed.error}`);

  const photo = formData.get("photo");
  const uploadedUrl = photo instanceof File ? await uploadImage(photo, "products") : null;
  const imageUrl = uploadedUrl ?? product!.imageUrl;

  await prisma.product.update({ where: { id: productId }, data: { imageUrl, ...parsed.data } });
  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function toggleProductActive(productId: string) {
  const session = await requirePermission("catalog");
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: session.businessId } });
  if (!product) return;
  await prisma.product.update({ where: { id: productId }, data: { active: !product.active } });
  revalidatePath("/dashboard/catalog");
}

export async function sellProduct(productId: string, formData: FormData) {
  const session = await requirePermission("catalog");
  const product = await prisma.product.findFirst({ where: { id: productId, businessId: session.businessId } });
  if (!product) redirect("/dashboard/catalog?error=NO_ENCONTRADO");

  const quantity = Number(formData.get("quantity") ?? NaN);
  const paymentMethodInput = String(formData.get("paymentMethod") ?? "CASH");
  const paymentMethod = ["CASH", "CARD_IN_PERSON"].includes(paymentMethodInput) ? paymentMethodInput : "CASH";

  if (!Number.isInteger(quantity) || quantity <= 0) {
    redirect(`/dashboard/catalog?error=CANTIDAD_INVALIDA`);
  }
  if (product!.stock !== null && quantity > product!.stock) {
    redirect(`/dashboard/catalog?error=STOCK_INSUFICIENTE`);
  }

  const receiptNumber = await assignReceiptNumber(session.businessId);

  await prisma.$transaction([
    ...(product!.stock !== null
      ? [prisma.product.update({ where: { id: productId }, data: { stock: { decrement: quantity } } })]
      : []),
    prisma.productSale.create({
      data: {
        productId,
        businessId: session.businessId,
        quantity,
        unitPrice: product!.price,
        total: product!.price * quantity,
        paymentMethod,
        soldByUserId: session.userId,
        receiptNumber,
      },
    }),
  ]);

  if (product!.stock !== null && product!.minStock !== null) {
    const newStock = product!.stock - quantity;
    if (newStock <= product!.minStock) {
      const business = await prisma.business.findUnique({ where: { id: session.businessId } });
      if (business) {
        const ownerEmails = await getOwnerEmails(session.organizationId);
        await Promise.all(
          ownerEmails.map((email) =>
            sendLowStockAlert(email, {
              businessName: business.name,
              productName: product!.name,
              currentStock: newStock,
              minStock: product!.minStock!,
            })
          )
        );
      }
    }
  }

  revalidatePath("/dashboard/catalog");
  revalidatePath("/dashboard/register");
  redirect("/dashboard/catalog");
}
