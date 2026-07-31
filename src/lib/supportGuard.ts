import { redirect } from "next/navigation";
import { getSupportSession, type SupportSessionPayload } from "@/lib/supportSession";

export async function requireSupportSession(): Promise<SupportSessionPayload> {
  const session = await getSupportSession();
  if (!session) redirect("/soporte/login");
  return session;
}
