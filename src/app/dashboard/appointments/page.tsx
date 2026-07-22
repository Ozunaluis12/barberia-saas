import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateAppointmentStatus, markAppointmentPaid } from "@/app/actions/appointments";
import { getVocabulary } from "@/lib/vocabulary";
import WalkInForm from "./WalkInForm";
import CopyReviewLinkButton from "./CopyReviewLinkButton";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const ERRORS: Record<string, string> = {
  CAJA_CERRADA:
    "No hay una caja abierta para registrar ese pago en efectivo. Abre una caja en la sección Caja primero.",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  const { error } = await searchParams;
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const [appointments, services, staffMembers] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        businessId: session.businessId,
        startTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: { staff: true, service: true },
      orderBy: { startTime: "asc" },
      take: 100,
    }),
    prisma.service.findMany({ where: { businessId: session.businessId, active: true } }),
    prisma.staff.findMany({ where: { businessId: session.businessId, active: true } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Citas</h1>
        <a
          href="/api/export/appointments"
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm hover:border-gold hover:text-gold"
        >
          Exportar CSV
        </a>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <div className="mt-6">
        <WalkInForm
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          staff={staffMembers.map((s) => ({ id: s.id, name: s.name }))}
          vocab={{ staffSingular: vocab.staffSingular, walkInLabel: vocab.walkInLabel }}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">{vocab.staffSingular}</th>
              <th className="px-4 py-2">Servicio</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Pago</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="px-4 py-2">
                  {a.startTime.toLocaleDateString("es", { day: "2-digit", month: "2-digit" })}{" "}
                  {a.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2">
                  {a.clientName}
                  {a.anyStaffRequested && (
                    <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">
                      auto-asignado
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{a.staff.name}</td>
                <td className="px-4 py-2">{a.service.name}</td>
                <td className="px-4 py-2 text-cream/70">{STATUS_LABEL[a.status] ?? a.status}</td>
                <td className="px-4 py-2">
                  {a.paymentStatus === "PAID" ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                        Pagado
                      </span>
                      <a
                        href={`/api/receipt/appointment/${a.id}`}
                        className="text-xs text-gold hover:underline"
                      >
                        Recibo
                      </a>
                    </div>
                  ) : (a.status === "CONFIRMED" || a.status === "COMPLETED") ? (
                    <div className="flex gap-2 text-xs">
                      <form action={markAppointmentPaid.bind(null, a.id, "CASH")}>
                        <button className="text-gold hover:underline">Efectivo</button>
                      </form>
                      <form action={markAppointmentPaid.bind(null, a.id, "CARD_IN_PERSON")}>
                        <button className="text-gold hover:underline">Tarjeta</button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-cream/40">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {a.status === "CONFIRMED" && (
                    <div className="flex justify-end gap-2 text-xs">
                      <form action={updateAppointmentStatus.bind(null, a.id, "COMPLETED")}>
                        <button className="text-green-400 hover:underline">Completar</button>
                      </form>
                      <form action={updateAppointmentStatus.bind(null, a.id, "NO_SHOW")}>
                        <button className="text-yellow-400 hover:underline">No asistió</button>
                      </form>
                      <form action={updateAppointmentStatus.bind(null, a.id, "CANCELLED")}>
                        <button className="text-red-400 hover:underline">Cancelar</button>
                      </form>
                    </div>
                  )}
                  {a.status === "COMPLETED" && (
                    <div className="flex justify-end">
                      <CopyReviewLinkButton appointmentId={a.id} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={7}>
                  No hay citas próximas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
