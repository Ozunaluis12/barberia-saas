import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPublicAppointment } from "@/app/actions/clientCancel";
import { getVocabulary } from "@/lib/vocabulary";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatCOP } from "@/lib/money";
import CancelButton from "./CancelButton";
import RescheduleButton from "./RescheduleButton";
import ReviewForm from "./ReviewForm";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
  PENDING_PAYMENT: "Pago pendiente de confirmar",
};

export default async function ClientAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appt = await getPublicAppointment(id);
  if (!appt) notFound();

  const h = await headers();
  const host = h.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const referralLink = host ? `${protocol}://${host}/book/${appt.business.slug}?ref=${appt.client.referralCode}` : null;

  const vocab = getVocabulary(appt.business.category);
  const isUpcoming = appt.startTime.getTime() > Date.now();

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <p className="text-sm uppercase tracking-widest text-gold">{appt.business.name}</p>
        <h1 className="mt-2 text-2xl font-bold">Tu cita</h1>

        <div className="mt-6 space-y-2 text-sm text-cream/80">
          <p>
            <span className="text-cream/50">Servicio:</span> {appt.service.name}
          </p>
          <p>
            <span className="text-cream/50">{vocab.staffSingular}:</span> {appt.staff.name}
          </p>
          <p>
            <span className="text-cream/50">Fecha:</span>{" "}
            {appt.startTime.toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p>
            <span className="text-cream/50">Hora:</span>{" "}
            {appt.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p>
            <span className="text-cream/50">Estado:</span> {STATUS_LABEL[appt.status] ?? appt.status}
          </p>
        </div>

        {appt.status === "PENDING_PAYMENT" && (
          <div className="mt-8 space-y-3 rounded-md border border-gold/40 bg-ink p-4 text-sm">
            <p className="font-semibold text-gold">
              Paga {formatCOP(appt.service.depositAmount ?? appt.business.advancePaymentAmount ?? appt.priceCharged ?? appt.service.price)} por adelantado para
              confirmar tu cita
            </p>
            {appt.business.paymentQrUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={appt.business.paymentQrUrl}
                alt="QR de pago"
                className="mx-auto h-40 w-40 object-contain"
              />
            )}
            {appt.business.paymentBrebKey && (
              <p className="text-cream/80">
                Llave Bre-B: <span className="font-semibold text-cream">{appt.business.paymentBrebKey}</span>
              </p>
            )}
            {appt.business.paymentAccountInfo && (
              <p className="whitespace-pre-line text-cream/80">{appt.business.paymentAccountInfo}</p>
            )}
            {(() => {
              const message = `Hola, soy ${appt.clientName}. Reservé ${appt.service.name} en ${appt.business.name} el ${appt.startTime.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })} a las ${appt.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}. Aquí está mi comprobante de pago.`;
              const link = appt.business.phone ? buildWhatsAppLink(appt.business.phone, message) : null;
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
              Si el negocio no confirma tu pago a tiempo, este horario podría liberarse.
            </p>
          </div>
        )}

        {appt.status === "CONFIRMED" && isUpcoming && (
          <div className="mt-8 space-y-3">
            <RescheduleButton
              appointmentId={appt.id}
              noticeHours={appt.business.cancellationNoticeHours}
            />
            <CancelButton
              appointmentId={appt.id}
              noticeHours={appt.business.cancellationNoticeHours}
            />
          </div>
        )}

        {appt.status === "CONFIRMED" && !isUpcoming && (
          <p className="mt-8 text-center text-sm text-cream/50">
            Esta cita ya pasó. Si no pudiste asistir, contacta directamente al negocio.
          </p>
        )}

        {appt.status === "COMPLETED" && (
          <div className="mt-8">
            {appt.review ? (
              <div className="rounded-md border border-white/10 bg-ink p-4 text-sm">
                <p className="text-gold">{"★".repeat(appt.review.rating)}</p>
                {appt.review.comment && (
                  <p className="mt-2 text-cream/70">{appt.review.comment}</p>
                )}
                <p className="mt-2 text-xs text-cream/40">¡Gracias por tu reseña!</p>
              </div>
            ) : (
              <ReviewForm appointmentId={appt.id} />
            )}
          </div>
        )}

        {appt.business.referralBonusPoints > 0 && referralLink && (
          <div className="mt-8 rounded-md border border-white/10 bg-ink p-4 text-sm">
            <p className="font-semibold text-gold">Invita a un amigo y gana puntos</p>
            <p className="mt-1 text-cream/70">
              Comparte tu enlace: cuando alguien reserve por primera vez con él, tú sumas puntos.
            </p>
            <a href={referralLink} className="mt-2 block break-all text-gold hover:underline">
              {referralLink}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
