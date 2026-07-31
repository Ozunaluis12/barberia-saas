"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createSupportSession, clearSupportSession } from "@/lib/supportSession";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function supportLoginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const ip = await getClientIp();
  if (!checkRateLimit(`support-login:ip:${ip}`, 10, 15 * 60 * 1000)) {
    redirect("/soporte/login?error=DEMASIADOS_INTENTOS");
  }

  const supportUser = await prisma.supportUser.findUnique({ where: { email } });
  if (!supportUser || !(await verifyPassword(password, supportUser.passwordHash))) {
    redirect("/soporte/login?error=CREDENCIALES_INVALIDAS");
  }
  if (!supportUser!.active) {
    redirect("/soporte/login?error=CUENTA_DESACTIVADA");
  }

  await createSupportSession({
    supportUserId: supportUser!.id,
    email: supportUser!.email,
    name: supportUser!.name,
  });
  redirect("/soporte");
}

export async function supportLogoutAction() {
  await clearSupportSession();
  redirect("/soporte/login");
}
