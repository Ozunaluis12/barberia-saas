import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const rangeStart = from
    ? new Date(`${from}T00:00:00`)
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const rangeEnd = to ? new Date(`${to}T23:59:59`) : new Date();

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  const sessions = await prisma.cashSession.findMany({
    where: {
      businessId: session.businessId,
      status: "CLOSED",
      closedAt: { gte: rangeStart, lte: rangeEnd },
    },
    include: { staff: true },
    orderBy: { closedAt: "asc" },
  });

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(18).text(business?.name ?? "Reporte de caja", { align: "left" });
  doc
    .fontSize(10)
    .fillColor("#555")
    .text(
      `Cierres de caja del ${rangeStart.toLocaleDateString("es")} al ${rangeEnd.toLocaleDateString("es")}`
    );
  doc.moveDown(1);

  const colX = { date: 40, staff: 150, expected: 290, counted: 370, diff: 450 };
  doc.fontSize(10).fillColor("#000");
  doc.text("Cerrada", colX.date, doc.y, { continued: false });
  doc.text("Empleado", colX.staff, doc.y - doc.currentLineHeight());
  doc.text("Esperado", colX.expected, doc.y - doc.currentLineHeight());
  doc.text("Contado", colX.counted, doc.y - doc.currentLineHeight());
  doc.text("Diferencia", colX.diff, doc.y - doc.currentLineHeight());
  doc.moveDown(0.5);
  doc
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.3);

  let totalDifference = 0;
  for (const s of sessions) {
    const y = doc.y;
    doc.fontSize(9).fillColor("#000");
    doc.text(
      s.closedAt ? s.closedAt.toLocaleString("es", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—",
      colX.date,
      y,
      { width: 105 }
    );
    doc.text(s.staff ? s.staff.name : "General", colX.staff, y, { width: 130 });
    doc.text(`$${(s.expectedAmount ?? 0).toFixed(2)}`, colX.expected, y, { width: 70 });
    doc.text(`$${(s.countedAmount ?? 0).toFixed(2)}`, colX.counted, y, { width: 70 });
    const diff = s.difference ?? 0;
    doc.fillColor(diff === 0 ? "#000" : diff > 0 ? "#0a7a2f" : "#b91c1c");
    doc.text(`${diff > 0 ? "+" : ""}${diff.toFixed(2)}`, colX.diff, y, { width: 90 });
    totalDifference += diff;
    doc.moveDown(0.6);
  }

  if (sessions.length === 0) {
    doc.fontSize(10).fillColor("#777").text("No hay cierres de caja en este rango.");
  } else {
    doc.moveDown(0.5);
    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor("#ccc")
      .stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#000").text(`Diferencia total: ${totalDifference >= 0 ? "+" : ""}${totalDifference.toFixed(2)}`);
  }

  doc.end();
  const buffer = await done;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="caja.pdf"`,
    },
  });
}
