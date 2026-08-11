import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function GiftCardStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const card = await prisma.giftCard.findUnique({
    where: { id },
    include: { business: true },
  });
  if (!card) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <p className="text-sm uppercase tracking-widest text-gold">{card.business.name}</p>
        <h1 className="mt-2 text-2xl font-bold">Tu tarjeta de regalo</h1>

        {card.status === "PENDING_PAYMENT" && (
          <div className="mt-6 space-y-3 rounded-md border border-gold/40 bg-ink p-4 text-sm">
            <p className="font-semibold text-gold">
              Paga {formatCOP(card.initialAmount)} por transferencia para activarla
            </p>
            {card.business.paymentQrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.business.paymentQrUrl}
                alt="QR de pago"
                className="mx-auto h-40 w-40 object-contain"
              />
            )}
            {card.business.paymentBrebKey && (
              <p className="text-cream/80">
                Llave Bre-B: <span className="font-semibold text-cream">{card.business.paymentBrebKey}</span>
              </p>
            )}
            {card.business.paymentAccountInfo && (
              <p className="whitespace-pre-line text-cream/80">{card.business.paymentAccountInfo}</p>
            )}
            {(() => {
              const message = `Hola, soy ${card.purchaserName}. Compré una tarjeta de regalo de ${card.business.name} por ${formatCOP(card.initialAmount)}. Aquí está mi comprobante de pago.`;
              const link = card.business.phone ? buildWhatsAppLink(card.business.phone, message) : null;
              return link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md bg-gold px-4 py-2 text-center font-semibold text-ink hover:bg-gold/90"
                >
                  Ya pagué, enviar comprobante
                </a>
              ) : (
                <p className="text-cream/50">Envía tu comprobante de pago al negocio.</p>
              );
            })()}
            <p className="text-xs text-cream/50">
              Guarda este enlace — aquí verás el código apenas el negocio confirme tu pago.
            </p>
          </div>
        )}

        {card.status === "ACTIVE" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-cream/70">Tu código, para usar en {card.business.name}:</p>
            <p className="rounded-md bg-ink px-4 py-3 text-center font-mono text-2xl tracking-widest text-gold">
              {card.code}
            </p>
            <p className="text-sm text-cream/70">
              Saldo disponible: <span className="font-semibold text-cream">{formatCOP(card.balance)}</span>
              {" "}de {formatCOP(card.initialAmount)}
            </p>
            {card.expiresAt && (
              <p className="text-xs text-cream/50">Vence el {card.expiresAt.toLocaleDateString("es")}.</p>
            )}
            {card.recipientName && (
              <p className="text-xs text-cream/50">A nombre de: {card.recipientName}</p>
            )}
          </div>
        )}

        {card.status === "CANCELLED" && (
          <p className="mt-6 text-sm text-cream/60">
            Esta tarjeta de regalo fue cancelada. Si crees que es un error, contacta al negocio.
          </p>
        )}
      </div>
    </main>
  );
}
