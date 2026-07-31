import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";
import { dismissOnboarding } from "@/app/actions/settings";
import { formatCOP } from "@/lib/money";

export default async function DashboardHome() {
  const session = await requireSession();
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const vocab = getVocabulary(business?.category ?? "OTHER");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      businessId: session.businessId,
      startTime: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    include: { staff: true, service: true },
    orderBy: { startTime: "asc" },
  });

  const [staffCount, serviceCount, pendingPaymentCount] = await Promise.all([
    prisma.staff.count({ where: { businessId: session.businessId, active: true } }),
    prisma.service.count({ where: { businessId: session.businessId, active: true } }),
    prisma.appointment.count({ where: { businessId: session.businessId, status: "PENDING_PAYMENT" } }),
  ]);

  const estimatedRevenue = todayAppointments.reduce(
    (sum, a) => sum + (a.priceCharged ?? a.service.price),
    0
  );

  const onboardingSteps = [
    { label: `Agrega tu primer ${vocab.staffSingular.toLowerCase()}`, done: staffCount > 0, href: "/dashboard/staff" },
    { label: "Agrega tu primer servicio", done: serviceCount > 0, href: "/dashboard/services" },
    { label: "Configura tu teléfono de contacto", done: !!business?.phone, href: "/dashboard/settings" },
  ];
  const showOnboarding = !business?.onboardingDismissed && onboardingSteps.some((s) => !s.done);

  return (
    <div>
      <h1 className="text-2xl font-bold">Resumen de hoy</h1>

      {showOnboarding && (
        <div className="mt-4 rounded-lg border border-gold/40 bg-charcoal p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gold">Primeros pasos</h2>
            <form action={dismissOnboarding}>
              <button className="text-xs text-cream/50 hover:text-cream">Ocultar</button>
            </form>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {onboardingSteps.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className={s.done ? "text-green-400" : "text-cream/30"}>{s.done ? "✓" : "○"}</span>
                {s.done ? (
                  <span className="text-cream/50 line-through">{s.label}</span>
                ) : (
                  <Link href={s.href} className="text-gold hover:underline">
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-charcoal p-5">
          <p className="text-sm text-cream/60">Citas hoy</p>
          <p className="mt-1 text-3xl font-bold text-gold">{todayAppointments.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-charcoal p-5">
          <p className="text-sm text-cream/60">Ingreso estimado hoy</p>
          <p className="mt-1 text-3xl font-bold text-gold">{formatCOP(estimatedRevenue)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-charcoal p-5">
          <p className="text-sm text-cream/60">{vocab.staffPlural} activos / servicios</p>
          <p className="mt-1 text-3xl font-bold text-gold">
            {staffCount} / {serviceCount}
          </p>
        </div>
        <Link
          href="/dashboard/appointments"
          className="rounded-lg border border-white/10 bg-charcoal p-5 hover:border-gold"
        >
          <p className="text-sm text-cream/60">Pagos por verificar</p>
          <p
            className={`mt-1 text-3xl font-bold ${pendingPaymentCount > 0 ? "text-yellow-400" : "text-gold"}`}
          >
            {pendingPaymentCount}
          </p>
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Agenda de hoy</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Hora</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">{vocab.staffSingular}</th>
                <th className="px-4 py-2">Servicio</th>
                <th className="px-4 py-2">Origen</th>
              </tr>
            </thead>
            <tbody>
              {todayAppointments.map((a) => (
                <tr key={a.id} className="border-t border-white/5">
                  <td className="px-4 py-2">
                    {a.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2">{a.clientName}</td>
                  <td className="px-4 py-2">{a.staff.name}</td>
                  <td className="px-4 py-2">{a.service.name}</td>
                  <td className="px-4 py-2 text-cream/60">
                    {a.source === "WALK_IN" ? vocab.walkInLabel : "Online"}
                  </td>
                </tr>
              ))}
              {todayAppointments.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                    No hay citas para hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
