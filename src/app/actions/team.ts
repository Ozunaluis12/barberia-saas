"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/guard";
import { hashPassword } from "@/lib/auth";

const GRANTABLE = ["staff", "catalog", "reports", "settings"];

function parsePermissions(formData: FormData): string {
  return formData
    .getAll("permissions")
    .map(String)
    .filter((p) => GRANTABLE.includes(p))
    .join(",");
}

export async function createTeamMember(formData: FormData) {
  const session = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const permissions = parsePermissions(formData);

  if (!name || !email || password.length < 6) {
    redirect("/dashboard/team?error=DATOS_INVALIDOS");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/dashboard/team?error=EMAIL_EN_USO");

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { businessId: session.businessId, name, email, passwordHash, role: "STAFF", permissions },
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

export async function updateTeamMemberPermissions(userId: string, formData: FormData) {
  const session = await requireOwner();
  const user = await prisma.user.findFirst({ where: { id: userId, businessId: session.businessId } });
  if (!user || user.role === "OWNER") redirect("/dashboard/team?error=NO_ENCONTRADO");

  const permissions = parsePermissions(formData);
  await prisma.user.update({ where: { id: userId }, data: { permissions } });
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}
