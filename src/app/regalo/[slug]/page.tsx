import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { purchaseGiftCardOnline } from "@/app/actions/giftCards";

const ERRORS: Record<string, string> = {
  DATOS_INVALIDOS: "Completa el monto, tu nombre y tu teléfono antes de continuar.",
  NO_DISPONIBLE: "Este negocio no vende tarjetas de regalo en este momento.",
  DEMASIADOS_INTENTOS: "Demasiados intentos, espera unos minutos e inténtalo de nuevo.",
};

export default async function BuyGiftCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) notFound();

  if (!business.giftCardsEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-center text-cream">
        <div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="mt-2 text-cream/60">Este negocio no vende tarjetas de regalo en este momento.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-cream">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Tarjeta de regalo</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
          </p>
        )}

        <form action={purchaseGiftCardOnline} className="space-y-4 rounded-lg border border-white/10 bg-charcoal p-6">
          <input type="hidden" name="businessSlug" value={slug} />
          {/* Honeypot: invisible para una persona, los bots de formularios lo suelen llenar */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

          <div>
            <label className="text-sm text-cream/70">Monto</label>
            <input
              type="number"
              name="amount"
              min={0}
              step="1"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>

          <hr className="border-white/10" />

          <div>
            <label className="text-sm text-cream/70">Tu nombre</label>
            <input
              name="purchaserName"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Tu teléfono (para avisarte cuando se confirme el pago)</label>
            <input
              name="purchaserPhone"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Tu correo (opcional)</label>
            <input
              type="email"
              name="purchaserEmail"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>

          <hr className="border-white/10" />

          <div>
            <label className="text-sm text-cream/70">¿Es un regalo? Nombre de quien la recibe (opcional)</label>
            <input
              name="recipientName"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Su teléfono (opcional, si quieres que le llegue el código a él/ella)</label>
            <input
              name="recipientPhone"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Vencimiento (opcional)</label>
            <input
              type="date"
              name="expiresAt"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Continuar
          </button>
          <p className="text-xs text-cream/40">
            En el siguiente paso verás cómo pagarla por transferencia — el negocio confirma el
            pago a mano cuando reciba tu comprobante.
          </p>
        </form>
      </div>
    </main>
  );
}
