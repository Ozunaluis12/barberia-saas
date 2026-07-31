import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Cookie separada de "turnify_session": una cuenta de Soporte nunca debe
// compartir cookie ni payload con una sesión de cliente (OWNER/STAFF).
const COOKIE_NAME = "turnify_support_session";

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET no está configurado. Defínelo en las variables de entorno " +
      "(.env en local, o en las env vars del servicio en producción) antes de iniciar la app."
  );
}
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export type SupportSessionPayload = {
  supportUserId: string;
  email: string;
  name: string;
};

export async function createSupportSession(payload: SupportSessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // sesión corta: esta cuenta tiene control total sobre todas las empresas
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSupportSession(): Promise<SupportSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SupportSessionPayload;
  } catch {
    return null;
  }
}

export async function clearSupportSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
