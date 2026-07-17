import { notFound } from "next/navigation";
import { getPublicAppointment } from "@/app/actions/clientCancel";
import CancelButton from "./CancelButton";

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-10 text-cream">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-charcoal p-8">
        <p className="text-sm uppercase tracking-widest text-gold">{appt.shop.name}</p>
        <h1 className="mt-2 text-2xl font-bold">Tu cita</h1>

        <div className="mt-6 space-y-2 text-sm text-cream/80">
          <p>
            <span className="text-cream/50">Servicio:</span> {appt.service.name}
          </p>
          <p>
            <span className="text-cream/50">Barbero:</span> {appt.barber.name}
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
              noticeHours={appt.shop.cancellationNoticeHours}
            />
          </div>
        )}
      </div>
    </main>
  );
}
