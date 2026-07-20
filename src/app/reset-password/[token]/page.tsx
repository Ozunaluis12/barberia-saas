import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <Link href="/" className="text-lg font-bold text-gold">
          Turnify
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Elige una nueva contraseña</h1>
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
