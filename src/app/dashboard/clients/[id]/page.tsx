import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!client) notFound();

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
