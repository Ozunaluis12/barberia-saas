import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <Link href="/" className="text-lg font-bold text-gold">
          Turnify
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Ingresa tu código</h1>
        <p className="mt-1 text-sm text-cream/60">
          Escribe el código de 6 dígitos que te enviamos por correo (vence en 15 minutos) y tu
          nueva contraseña.
        </p>
        <ResetPasswordForm initialEmail={email ?? ""} />
      </div>
    </main>
  );
}
