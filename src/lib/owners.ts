import { prisma } from "@/lib/db";

/** Correos de todos los dueños de la organización, para alertas automáticas. */
export async function getOwnerEmails(organizationId: string): Promise<string[]> {
  const owners = await prisma.user.findMany({
    where: { role: "OWNER", business: { organizationId } },
    select: { email: true },
  });
  return owners.map((o) => o.email);
}
