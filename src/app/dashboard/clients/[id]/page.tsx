import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { redeemLoyaltyReward } from "@/app/actions/loyalty";
import { setClientMarketingOptIn } from "@/app/actions/clients";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const ERRORS: Record<string, string> = {
  FIDELIZACION_DESACTIVADA: "El programa de puntos no está activado para este negocio.",
  PUNTOS_INSUFICIENTES: "El cliente todavía no alcanza los puntos necesarios.",
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; redeemed?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { error, redeemed } = await searchParams;

  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!client) notFound();

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });

  const appointments = await prisma.appointment.findMany({
    where: { clientId: client.id },
    include: { staff: true, service: true, business: true, review: true },
    orderBy: { startTime: "desc" },
  });

  return (
    <div>
      <Link href="/dashboard/clients" className="text-sm text-cream/50 hover:text-cream">
        ← Volver
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{client.name}</h1>
      <p className="mt-1 text-sm text-cream/60">
        {client.phone} · {client.strikes} {client.strikes === 1 ? "sanción" : "sanciones"} ·
        Cliente desde{" "}
        {client.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </p>

      {business?.loyaltyEnabled && (
        <div className="mt-4 flex items-center gap-4 rounded-md border border-white/10 bg-charcoal px-4 py-3">
          <p className="text-sm text-cream/70">
            <span className="font-semibold text-gold">{client.loyaltyPoints} puntos</span>
            {" "}· recompensa disponible a partir de {business.loyaltyRewardThreshold} puntos
          </p>
          {client.loyaltyPoints >= business.loyaltyRewardThreshold && (
            <form action={redeemLoyaltyReward.bind(null, client.id)}>
              <button className="rounded-md bg-gold px-3 py-1.5 text-sm font-semibold text-ink hover:bg-gold/90">
                Canjear recompensa
              </button>
            </form>
          )}
        </div>
      )}

      {redeemed && (
        <p className="mt-3 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Recompensa canjeada correctamente.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <form
        action={setClientMarketingOptIn.bind(null, client.id)}
        className="mt-4 flex items-center gap-3 rounded-md border border-white/10 bg-charcoal px-4 py-3"
      >
        <label className="flex items-center gap-2 text-sm text-cream/70">
          <input type="checkbox" name="marketingOptIn" defaultChecked={client.marketingOptIn} />
          Recibir mensajes de difusión/promociones por WhatsApp
        </label>
        <button className="rounded-md border border-white/20 px-3 py-1 text-xs hover:border-gold hover:text-gold">
          Guardar
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Historial de procedimientos</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-charcoal text-left text-cream/60">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Servicio</th>
              <th className="px-4 py-2">Atendido por</th>
              <th className="px-4 py-2">Sucursal</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Pago</th>
              <th className="px-4 py-2">Reseña</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="px-4 py-2 text-cream/70">
                  {a.startTime.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                  {a.startTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2">{a.service.name}</td>
                <td className="px-4 py-2">{a.staff.name}</td>
                <td className="px-4 py-2 text-cream/60">{a.business.name}</td>
                <td className="px-4 py-2 text-cream/70">{STATUS_LABEL[a.status] ?? a.status}</td>
                <td className="px-4 py-2 text-cream/70">
                  {a.paymentStatus === "PAID" ? "Pagado" : "—"}
                </td>
                <td className="px-4 py-2 text-gold">
                  {a.review ? "★".repeat(a.review.rating) : "—"}
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-cream/40" colSpan={7}>
                  Sin citas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
