import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Efectivo",
  CARD_IN_PERSON: "Tarjeta",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const { id } = await params;
  const sale = await prisma.productSale.findFirst({
    where: { id, businessId: session.businessId },
    include: { business: true, product: true, soldBy: true },
  });
  if (!sale) return new NextResponse("No encontrado", { status: 404 });

  const doc = new PDFDocument({ margin: 40, size: "A5" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(16).text(sale.business.name, { align: "left" });
  if (sale.business.address) {
    doc.fontSize(9).fillColor("#555").text(sale.business.address);
  }
  if (sale.business.phone) {
    doc.fontSize(9).fillColor("#555").text(sale.business.phone);
  }
  doc.moveDown(1);
  doc.fontSize(13).fillColor("#000").text("Recibo de venta");
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(
      sale.createdAt.toLocaleString("es", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  doc.moveDown(1);

  doc.fontSize(10).fillColor("#000");
  doc.text(`Vendido por: ${sale.soldBy.name}`);
  doc.moveDown(0.8);

  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  doc.text(`${sale.product.name} x${sale.quantity}`, 40, doc.y, { continued: true, width: 250 });
  doc.text(`$${sale.total.toFixed(2)}`, { align: "right" });
  doc.fontSize(9).fillColor("#555").text(`Precio unitario: $${sale.unitPrice.toFixed(2)}`);
  doc.moveDown(0.8);

  doc
    .moveTo(40, doc.y)
    .lineTo(doc.page.width - 40, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor("#000").text("Total", 40, doc.y, { continued: true, width: 250 });
  doc.text(`$${sale.total.toFixed(2)}`, { align: "right" });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#555").text(`Método de pago: ${PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}`);

  doc.moveDown(1.5);
  doc
    .fontSize(8)
    .fillColor("#999")
    .text("Este recibo es un comprobante interno del negocio y no reemplaza una factura electrónica.", {
      align: "center",
    });

  doc.end();
  const buffer = await done;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-venta-${sale.id}.pdf"`,
    },
  });
}
