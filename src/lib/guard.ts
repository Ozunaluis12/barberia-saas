import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Páginas y acciones exclusivas del dueño (personal, servicios, reportes, configuración, equipo). */
export async function requireOwner(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "OWNER") redirect("/dashboard");
  return session;
}
