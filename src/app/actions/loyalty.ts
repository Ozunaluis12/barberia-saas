"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export async function redeemLoyaltyReward(clientId: string) {
  const session = await requireSession();

  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: session.organizationId },
  });
  if (!client) redirect("/dashboard/clients");

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business?.loyaltyEnabled) {
    redirect(`/dashboard/clients/${clientId}?error=FIDELIZACION_DESACTIVADA`);
  }
  if (client!.loyaltyPoints < business!.loyaltyRewardThreshold) {
    redirect(`/dashboard/clients/${clientId}?error=PUNTOS_INSUFICIENTES`);
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { loyaltyPoints: { decrement: business!.loyaltyRewardThreshold } },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${clientId}?redeemed=1`);
}
