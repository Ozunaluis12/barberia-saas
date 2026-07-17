import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { updateAppointmentStatus } from "@/app/actions/appointments";
import WalkInForm from "./WalkInForm";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export default async function AppointmentsPage() {
  const session = await requireSession();

  const [appointments, services, barbers] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        shopId: session.shopId,
        startTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: { barber: true, service: true },
      orderBy: { startTime: "asc" },
      take: 100,
    }),
    prisma.service.findMany({ where: { shopId: session.shopId, active: true } }),
    prisma.barber.findMany({ where: { shopId: session.shopId, active: true } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Citas</h1>
      </div>

      <div className="mt-6">
        <WalkInForm
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          barbers={barbers.map((b) => ({ id: b.id, name: b.name }))}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Barbero</th>
              <th className="px-4 py-2">Servicio</th>
              <th className="px-4 py-2">Estado</th>
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
                  {a.anyBarberRequested && (
                    <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">
                      auto-asignado
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">{a.barber.name}</td>
                <td className="px-4 py-2">{a.service.name}</td>
                <td className="px-4 py-2 text-cream/70">{STATUS_LABEL[a.status] ?? a.status}</td>
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
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={6}>
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
