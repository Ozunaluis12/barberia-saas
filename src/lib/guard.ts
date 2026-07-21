import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Páginas y acciones exclusivas del dueño (equipo, sucursales). */
export async function requireOwner(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "OWNER") redirect("/dashboard");
  return session;
}

export type GrantablePermission = "staff" | "catalog" | "reports" | "settings";

/**
 * Páginas y acciones que el dueño puede delegar a cuentas de Personal
 * (personal/roster, catálogo, reportes, configuración). El dueño siempre
 * tiene acceso; una cuenta de Personal solo si tiene el permiso otorgado.
 */
export async function requirePermission(key: GrantablePermission): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role === "OWNER") return session;
  const perms = session.permissions ? session.permissions.split(",") : [];
  if (!perms.includes(key)) redirect("/dashboard");
  return session;
}
