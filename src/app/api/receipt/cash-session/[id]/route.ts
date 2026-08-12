import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatCOP } from "@/lib/money";
import { canOperateDrawer, getSessionMovements } from "@/lib/cashSession";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  CARD_IN_PERSON: "Tarjeta",
  TRANSFER: "Transferencia",
  REFUND_CASH: "Reembolso (efectivo)",
  REFUND_CARD_IN_PERSON: "Reembolso (tarjeta)",
  INGRESO: "Ingreso manual",
  EGRESO: "Egreso manual",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const tipo = url.searchParams.get("tipo") === "detallada" ? "detallada" : "resumida";

  const cashSession = await prisma.cashSession.findFirst({
    where: { id, businessId: session.businessId, status: "CLOSED" },
    include: { staff: true, closedBy: true, business: true },
  });
  if (!cashSession) return new NextResponse("No encontrado", { status: 404 });

  const isOwner = session.role === "OWNER";
  if (!isOwner && !canOperateDrawer(session, cashSession.staffId)) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const { cardTotal, transferTotal, salesCount, movements } = await getSessionMovements(cashSession, cashSession.closedAt!);
  const drawerLabel = cashSession.staff?.name ?? "Caja general";
  const difference = cashSession.difference ?? 0;
  const matched = difference === 0;
  const statusLabel = matched
    ? "Recaudo coincide"
    : difference > 0
      ? `Sobrante de ${formatCOP(difference)}`
      : `Faltante de ${formatCOP(Math.abs(difference))}`;

  const doc = new PDFDocument({ margin: 40, size: "A5" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  if (cashSession.business.logoUrl) {
    try {
      const logoRes = await fetch(cashSession.business.logoUrl);
      const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
      doc.image(logoBuffer, doc.page.width - 40 - 60, 40, { width: 60 });
    } catch {
      // Si el logo no se pudo descargar, la tirilla sigue solo con texto.
    }
  }

  doc.fontSize(16).text(cashSession.business.name, { align: "left" });
  if (cashSession.business.taxId) {
    doc.fontSize(9).fillColor("#555").text(`NIT: ${cashSession.business.taxId}`);
  }
  if (cashSession.business.address) {
    doc.fontSize(9).fillColor("#555").text(cashSession.business.address);
  }
  if (cashSession.business.phone) {
    doc.fontSize(9).fillColor("#555").text(cashSession.business.phone);
  }
  doc.moveDown(1);
  doc.fontSize(13).fillColor("#000").text(`Cierre de caja — ${drawerLabel}`);
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(
      `${cashSession.openedAt.toLocaleString("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} → ${cashSession.closedAt!.toLocaleString("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
    );
  doc.text(`Cerrada por: ${cashSession.closedBy?.name ?? "—"}`);
  doc.moveDown(1);

  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  const row = (label: string, value: string, opts?: { bold?: boolean; color?: string }) => {
    doc
      .fontSize(10)
      .fillColor(opts?.color ?? "#000")
      .text(label, 40, doc.y, { continued: true, width: 250 });
    doc.text(value, { align: "right" });
    if (opts?.bold) doc.moveDown(0.1);
    doc.moveDown(0.4);
  };

  row("Monto inicial", formatCOP(cashSession.openingAmount));
  row("Efectivo recaudado", formatCOP(cashSession.countedAmount ?? 0));
  row("Efectivo esperado", formatCOP(cashSession.expectedAmount ?? 0));
  row(
    "Diferencia en efectivo",
    `${difference > 0 ? "+" : ""}${formatCOP(difference)}`,
    { color: matched ? "#000" : difference > 0 ? "#0a7a2f" : "#b91c1c" }
  );
  row("Tarjeta en persona", formatCOP(cardTotal));
  row("Transferencias (anticipos/tarjetas de regalo)", formatCOP(transferTotal));
  row("Total de ventas", String(salesCount));

  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  doc.fontSize(12).fillColor(matched ? "#0a7a2f" : difference > 0 ? "#0a7a2f" : "#b91c1c").text(statusLabel, { align: "center" });
  doc.moveDown(0.8);

  if (cashSession.notes) {
    doc.fontSize(9).fillColor("#555").text(`Notas: ${cashSession.notes}`);
    doc.moveDown(0.5);
  }

  if (tipo === "detallada" && movements.length > 0) {
    doc
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .strokeColor("#ccc")
      .stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#000").text("Detalle de movimientos");
    doc.moveDown(0.3);
    for (const m of movements) {
      doc
        .fontSize(9)
        .fillColor("#000")
        .text(
          `${m.at.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} · ${m.label} (${PAYMENT_LABEL[m.method] ?? m.method})`,
          40,
          doc.y,
          { continued: true, width: 300 }
        );
      doc.fillColor(m.amount < 0 ? "#b91c1c" : "#000").text(formatCOP(m.amount), { align: "right" });
      doc.moveDown(0.25);
    }
    doc.moveDown(0.5);
  }

  doc
    .fontSize(8)
    .fillColor("#999")
    .text(
      "Documento de uso interno. No es una factura electrónica ni un documento equivalente POS válido ante la DIAN.",
      { align: "center" }
    );

  doc.end();
  const buffer = await done;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="caja-${drawerLabel.replace(/\s+/g, "-").toLowerCase()}-${tipo}.pdf"`,
    },
  });
}
