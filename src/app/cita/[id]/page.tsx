import { notFound } from "next/navigation";
import { getPublicAppointment } from "@/app/actions/clientCancel";
import { getVocabulary } from "@/lib/vocabulary";
import CancelButton from "./CancelButton";
import ReviewForm from "./ReviewForm";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export default async function ClientAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appt = await getPublicAppointment(id);
  if (!appt) notFound();

  const vocab = getVocabulary(appt.business.category);

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

        {appt.status === "CONFIRMED" && (
          <div className="mt-8">
            <CancelButton
              appointmentId={appt.id}
              noticeHours={appt.business.cancellationNoticeHours}
            />
          </div>
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
      </div>
    </main>
  );
}
