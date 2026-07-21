import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "turnify_session";

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET no está configurado. Defínelo en las variables de entorno " +
      "(.env en local, o en las env vars del servicio en producción) antes de iniciar la app."
  );
}
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export type SessionPayload = {
  userId: string;
  organizationId: string;
  businessId: string; // sucursal activa en esta sesión (el dueño puede cambiarla)
  businessSlug: string;
  role: string;
  permissions: string; // CSV, solo relevante para role === "STAFF"
  staffId: string | null; // a qué miembro del roster corresponde esta cuenta (para cajas personales)
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
