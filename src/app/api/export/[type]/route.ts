import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function toCsvRow(fields: (string | number)[]): string {
  return (
    fields
      .map((f) => {
        const s = String(f ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",") + "\r\n"
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const { type } = await params;
  let csv = "";
  let filename = "export.csv";

  if (type === "clients") {
    const clients = await prisma.client.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "asc" },
    });
    csv += toCsvRow(["Nombre", "Teléfono", "Sanciones", "Citas totales", "Cliente desde"]);
    for (const c of clients) {
      const count = await prisma.appointment.count({ where: { clientId: c.id } });
      csv += toCsvRow([c.name, c.phone, c.strikes, count, c.createdAt.toISOString().slice(0, 10)]);
    }
    filename = "clientes.csv";
  } else if (type === "appointments") {
    const appointments = await prisma.appointment.findMany({
      where: { businessId: session.businessId },
      include: { staff: true, service: true },
      orderBy: { startTime: "desc" },
    });
    csv += toCsvRow([
      "Fecha",
      "Hora",
      "Cliente",
      "Teléfono",
      "Personal",
      "Servicio",
      "Precio",
      "Estado",
      "Origen",
      "Pago",
    ]);
    for (const a of appointments) {
      csv += toCsvRow([
        a.startTime.toISOString().slice(0, 10),
        a.startTime.toISOString().slice(11, 16),
        a.clientName,
        a.clientPhone,
        a.staff.name,
        a.service.name,
        (a.priceCharged ?? a.service.price).toFixed(2),
        a.status,
        a.source,
        a.paymentStatus,
      ]);
    }
    filename = "citas.csv";
  } else if (type === "reports") {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const rangeStart = from
      ? new Date(`${from}T00:00:00`)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const rangeEnd = to ? new Date(`${to}T23:59:59`) : new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: session.businessId,
        status: "COMPLETED",
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      include: { staff: true, service: true },
    });

    const byStaff = new Map<
      string,
      { name: string; commissionPercent: number | null; count: number; revenue: number }
    >();
    for (const a of appointments) {
      const entry = byStaff.get(a.staffId) ?? {
        name: a.staff.name,
        commissionPercent: a.staff.commissionPercent,
        count: 0,
        revenue: 0,
      };
      entry.count += 1;
      entry.revenue += a.priceCharged ?? a.service.price;
      byStaff.set(a.staffId, entry);
    }

    csv += toCsvRow([
      "Personal",
      "Citas completadas",
      "Ingreso",
      "% comisión",
      "Le corresponde",
      "Se queda el negocio",
    ]);
    for (const r of byStaff.values()) {
      const commission = r.commissionPercent === null ? null : r.revenue * (r.commissionPercent / 100);
      csv += toCsvRow([
        r.name,
        r.count,
        r.revenue.toFixed(2),
        r.commissionPercent ?? "",
        commission !== null ? commission.toFixed(2) : "",
        (r.revenue - (commission ?? 0)).toFixed(2),
      ]);
    }
    filename = "reportes.csv";
  } else {
    return new NextResponse("Tipo de exportación no válido", { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
