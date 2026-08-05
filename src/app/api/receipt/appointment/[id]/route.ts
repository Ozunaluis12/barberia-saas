import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { formatCOP } from "@/lib/money";
import { assignReceiptNumber } from "@/lib/receipts";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  CARD_IN_PERSON: "Tarjeta",
  ONLINE: "Pago en línea",
  UNPAID: "Sin pagar",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  let appointment = await prisma.appointment.findFirst({
    where: { id, businessId: session.businessId },
    include: { business: true, staff: true, service: true },
  });
  if (!appointment) return new NextResponse("No encontrado", { status: 404 });

  // Citas pagadas antes de que existiera el consecutivo: se les asigna uno la
  // primera vez que alguien pide su recibo, para que ninguna quede sin número.
  if (appointment.receiptNumber === null) {
    const receiptNumber = await assignReceiptNumber(session.businessId);
    appointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { receiptNumber },
      include: { business: true, staff: true, service: true },
    });
  }

  const doc = new PDFDocument({ margin: 40, size: "A5" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  if (appointment.business.logoUrl) {
    try {
      const logoRes = await fetch(appointment.business.logoUrl);
      const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
      doc.image(logoBuffer, doc.page.width - 40 - 60, 40, { width: 60 });
    } catch {
      // Si el logo no se pudo descargar, la factura sigue solo con texto.
    }
  }

  doc.fontSize(16).text(appointment.business.name, { align: "left" });
  if (appointment.business.taxId) {
    doc.fontSize(9).fillColor("#555").text(`NIT: ${appointment.business.taxId}`);
  }
  if (appointment.business.address) {
    doc.fontSize(9).fillColor("#555").text(appointment.business.address);
  }
  if (appointment.business.phone) {
    doc.fontSize(9).fillColor("#555").text(appointment.business.phone);
  }
  doc.moveDown(1);
  doc.fontSize(13).fillColor("#000").text(`Factura de venta No. ${appointment.receiptNumber}`);
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(
      appointment.startTime.toLocaleString("es", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  doc.moveDown(1);

  doc.fontSize(10).fillColor("#000");
  doc.text(`Cliente: ${appointment.clientName}`);
  doc.text(`Atendido por: ${appointment.staff.name}`);
  doc.moveDown(0.8);

  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  const price = appointment.priceCharged ?? appointment.service.price;
  doc.fontSize(10).text(appointment.service.name, 40, doc.y, { continued: true, width: 250 });
  doc.text(formatCOP(price), { align: "right" });
  doc.moveDown(0.8);

  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  doc.fontSize(11).text("Total", 40, doc.y, { continued: true, width: 250 });
  doc.text(formatCOP(price), { align: "right" });
  doc.moveDown(0.5);

  if (appointment.depositAmount) {
    const balance = price - appointment.depositAmount;
    doc.fontSize(9).fillColor("#555");
    doc.text(`Anticipo pagado: ${formatCOP(appointment.depositAmount)}`);
    doc.text(`Saldo cobrado: ${formatCOP(balance)}`);
    doc.moveDown(0.3);
  }

  doc.fontSize(9).fillColor("#555").text(`Método de pago: ${PAYMENT_LABEL[appointment.paymentMethod] ?? appointment.paymentMethod}`);

  doc.moveDown(1.5);
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
      "Content-Disposition": `attachment; filename="factura-${appointment.receiptNumber}.pdf"`,
    },
  });
}
