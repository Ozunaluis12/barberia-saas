"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

/** Quita a alguien de la lista de espera — ya reservó, ya no le interesa, o lo contactaron a mano. */
export async function removeWaitlistEntry(entryId: string) {
  const session = await requireSession();
  const entry = await prisma.waitlistEntry.findFirst({
    where: { id: entryId, businessId: session.businessId },
  });
  if (!entry) return;

  await prisma.waitlistEntry.delete({ where: { id: entryId } });
  revalidatePath("/dashboard/waitlist");
}
