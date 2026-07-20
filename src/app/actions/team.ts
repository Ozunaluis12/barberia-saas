"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/guard";
import { hashPassword } from "@/lib/auth";

export async function createTeamMember(formData: FormData) {
  const session = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    redirect("/dashboard/team?error=DATOS_INVALIDOS");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/dashboard/team?error=EMAIL_EN_USO");

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { businessId: session.businessId, name, email, passwordHash, role: "STAFF" },
  });

  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

export async function toggleTeamMemberActive(userId: string) {
  const session = await requireOwner();
  const user = await prisma.user.findFirst({ where: { id: userId, businessId: session.businessId } });
  if (!user || user.role === "OWNER") return;
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  revalidatePath("/dashboard/team");
}
