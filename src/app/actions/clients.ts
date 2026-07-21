"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export async function setClientMarketingOptIn(clientId: string, formData: FormData) {
  const session = await requireSession();
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: session.organizationId },
  });
  if (!client) return;

  const marketingOptIn = formData.get("marketingOptIn") === "on";
  await prisma.client.update({ where: { id: clientId }, data: { marketingOptIn } });
  revalidatePath(`/dashboard/clients/${clientId}`);
}
