import { prisma } from "@/lib/db";

/**
 * Solo el dueño, o el miembro del roster vinculado a esa caja personal, puede
 * abrirla/cerrarla. La caja general (staffId null) es exclusiva del dueño,
 * porque nadie en particular es responsable de ella.
 */
export function canOperateDrawer(session: { role: string; staffId: string | null }, drawerStaffId: string | null): boolean {
  if (session.role === "OWNER") return true;
  if (drawerStaffId === null) return false;
  return session.staffId === drawerStaffId;
}

export type SessionMovement = {
  at: Date;
  label: string;
  method: string;
  amount: number;
};

export type SessionMovements = {
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  salesCount: number;
  movements: SessionMovement[];
};

/**
 * Reconstruye todo lo que le entró de dinero a una caja durante su ventana
 * (apertura → cierre, o "ahora" si sigue abierta): mismo criterio de
 * atribución en todas las fuentes.
 *
 * Catálogo, Tiendita y tarjetas de regalo también se venden en persona, así
 * que una caja personal (staffId) sí debe verlas — se atribuyen por quién
 * las vendió/confirmó (soldBy/issuedBy/depositConfirmedBy), cruzando con qué
 * miembro del roster es esa cuenta de usuario. La caja general (staffId
 * null) sigue viendo todo el negocio sin filtrar por vendedor, igual que ya
 * pasaba con las citas.
 *
 * Las transferencias (anticipos y tarjetas de regalo confirmados en línea)
 * no fueron dinero físico entrando a esa caja, así que no se comparan contra
 * ningún conteo a ciegas — son informativas, confiadas del sistema, igual
 * que la tarjeta en persona.
 *
 * Los reembolsos (efectivo o tarjeta, según cómo se pagó originalmente) y
 * los movimientos manuales (+Ingreso/-Egreso) también se descuentan/suman al
 * efectivo esperado — un reembolso en efectivo sí salió físicamente del
 * cajón, y por eso debe restarse para que la caja no aparezca "faltante"
 * por algo que en realidad fue un reembolso legítimo.
 *
 * Único lugar de verdad para este cálculo: lo usan el cierre de caja, la
 * página de detalle (en vivo o congelada) y la tirilla en PDF.
 */
export async function getSessionMovements(
  cashSession: { id: string; businessId: string; staffId: string | null; openedAt: Date },
  until: Date
): Promise<SessionMovements> {
  // Se incluye REFUNDED (no solo PAID) para que la venta original siga
  // apareciendo aunque después se haya reembolsado — el reembolso se suma
  // aparte, como su propia línea negativa, en vez de hacer como si la venta
  // nunca hubiera pasado.
  const appointmentsInWindow = await prisma.appointment.findMany({
    where: {
      businessId: cashSession.businessId,
      ...(cashSession.staffId ? { staffId: cashSession.staffId } : {}),
      paymentMethod: { in: ["CASH", "CARD_IN_PERSON"] },
      paymentStatus: { in: ["PAID", "REFUNDED"] },
      paidAt: { gte: cashSession.openedAt, lte: until },
    },
    select: {
      paidAt: true,
      paymentMethod: true,
      priceCharged: true,
      depositAmount: true,
      giftCardRedeemed: true,
      clientName: true,
      service: { select: { name: true } },
    },
    orderBy: { paidAt: "asc" },
  });

  // Reembolsos procesados por alguien de esta caja: se cuenta aparte de la
  // venta original porque puede haber pasado en una sesión distinta (incluso
  // en un turno o día distinto).
  const refundsInWindow = await prisma.appointment.findMany({
    where: {
      businessId: cashSession.businessId,
      paymentMethod: { in: ["CASH", "CARD_IN_PERSON"] },
      paymentStatus: "REFUNDED",
      refundedAt: { gte: cashSession.openedAt, lte: until },
      ...(cashSession.staffId ? { refundedBy: { staffId: cashSession.staffId } } : {}),
    },
    select: {
      refundedAt: true,
      paymentMethod: true,
      priceCharged: true,
      depositAmount: true,
      giftCardRedeemed: true,
      refundReason: true,
      clientName: true,
      service: { select: { name: true } },
    },
    orderBy: { refundedAt: "asc" },
  });

  // Movimientos manuales de esta caja puntual (no se filtran por vendedor:
  // ya están atados a esta sesión específica por cashSessionId).
  const cashMovementsInWindow = await prisma.cashMovement.findMany({
    where: { cashSessionId: cashSession.id, createdAt: { gte: cashSession.openedAt, lte: until } },
    select: { createdAt: true, type: true, amount: true, concept: true },
    orderBy: { createdAt: "asc" },
  });

  // Anticipos pagados por transferencia y confirmados por alguien de esta
  // caja — se guarda aparte de paidAt/paymentMethod porque esos se
  // sobrescriben después, al cobrar el saldo en persona.
  const depositTransfersInWindow = await prisma.appointment.findMany({
    where: {
      businessId: cashSession.businessId,
      depositAmount: { not: null },
      depositConfirmedAt: { gte: cashSession.openedAt, lte: until },
      ...(cashSession.staffId ? { depositConfirmedBy: { staffId: cashSession.staffId } } : {}),
    },
    select: {
      depositConfirmedAt: true,
      depositAmount: true,
      clientName: true,
      service: { select: { name: true } },
    },
    orderBy: { depositConfirmedAt: "asc" },
  });

  const soldByStaffFilter = cashSession.staffId ? { soldBy: { staffId: cashSession.staffId } } : {};
  const issuedByStaffFilter = cashSession.staffId ? { issuedBy: { staffId: cashSession.staffId } } : {};

  const [productSalesInWindow, storeSalesInWindow, giftCardsInWindow] = await Promise.all([
    prisma.productSale.findMany({
      where: {
        businessId: cashSession.businessId,
        paymentMethod: { in: ["CASH", "CARD_IN_PERSON"] },
        createdAt: { gte: cashSession.openedAt, lte: until },
        ...soldByStaffFilter,
      },
      select: {
        createdAt: true,
        paymentMethod: true,
        total: true,
        quantity: true,
        giftCardRedeemed: true,
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.storeSale.findMany({
      where: {
        businessId: cashSession.businessId,
        paymentMethod: { in: ["CASH", "CARD_IN_PERSON"] },
        createdAt: { gte: cashSession.openedAt, lte: until },
        ...soldByStaffFilter,
      },
      select: {
        createdAt: true,
        paymentMethod: true,
        total: true,
        quantity: true,
        giftCardRedeemed: true,
        storeItem: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    // Tarjetas de regalo: emitidas en persona (mostrador, CASH/CARD_IN_PERSON)
    // o compradas en línea y confirmadas por alguien de esta caja (siempre
    // TRANSFER) — issuedByUserId cubre ambos casos, sea quien la vendió en
    // persona o quien confirmó el comprobante.
    prisma.giftCard.findMany({
      where: {
        businessId: cashSession.businessId,
        paymentMethod: { in: ["CASH", "CARD_IN_PERSON", "TRANSFER"] },
        confirmedAt: { gte: cashSession.openedAt, lte: until },
        ...issuedByStaffFilter,
      },
      select: {
        confirmedAt: true,
        paymentMethod: true,
        initialAmount: true,
        code: true,
      },
      orderBy: { confirmedAt: "asc" },
    }),
  ]);

  const movements: SessionMovement[] = [];
  let cashTotal = 0;
  let cardTotal = 0;
  let transferTotal = 0;
  let salesCount = 0;

  for (const a of appointmentsInWindow) {
    // Ni el anticipo (se cobró antes, por transferencia) ni el saldo cubierto
    // con tarjeta de regalo fueron dinero real entrando a esta caja hoy.
    const netAmount = (a.priceCharged ?? 0) - (a.depositAmount ?? 0) - (a.giftCardRedeemed ?? 0);
    if (a.paymentMethod === "CASH") cashTotal += netAmount;
    else cardTotal += netAmount;
    salesCount++;
    movements.push({
      at: a.paidAt!,
      label: `${a.service.name} · ${a.clientName}`,
      method: a.paymentMethod,
      amount: netAmount,
    });
  }

  for (const a of depositTransfersInWindow) {
    transferTotal += a.depositAmount ?? 0;
    salesCount++;
    movements.push({
      at: a.depositConfirmedAt!,
      label: `Anticipo confirmado · ${a.service.name} · ${a.clientName}`,
      method: "TRANSFER",
      amount: a.depositAmount ?? 0,
    });
  }

  for (const s of productSalesInWindow) {
    const netAmount = s.total - (s.giftCardRedeemed ?? 0);
    if (s.paymentMethod === "CASH") cashTotal += netAmount;
    else cardTotal += netAmount;
    salesCount++;
    movements.push({
      at: s.createdAt,
      label: `${s.product.name} x${s.quantity}`,
      method: s.paymentMethod,
      amount: netAmount,
    });
  }

  for (const s of storeSalesInWindow) {
    const netAmount = s.total - (s.giftCardRedeemed ?? 0);
    if (s.paymentMethod === "CASH") cashTotal += netAmount;
    else cardTotal += netAmount;
    salesCount++;
    movements.push({
      at: s.createdAt,
      label: `${s.storeItem.name} x${s.quantity}`,
      method: s.paymentMethod,
      amount: netAmount,
    });
  }

  for (const g of giftCardsInWindow) {
    if (g.paymentMethod === "CASH") cashTotal += g.initialAmount;
    else if (g.paymentMethod === "CARD_IN_PERSON") cardTotal += g.initialAmount;
    else transferTotal += g.initialAmount;
    salesCount++;
    movements.push({
      at: g.confirmedAt!,
      label: `Tarjeta de regalo emitida (${g.code})`,
      method: g.paymentMethod!,
      amount: g.initialAmount,
    });
  }

  for (const r of refundsInWindow) {
    // Se reembolsa el neto que realmente había entrado (el anticipo y lo
    // cubierto con tarjeta de regalo nunca fueron efectivo/tarjeta de esta
    // caja, así que tampoco salen de aquí al reembolsar).
    const netAmount = (r.priceCharged ?? 0) - (r.depositAmount ?? 0) - (r.giftCardRedeemed ?? 0);
    if (r.paymentMethod === "CASH") cashTotal -= netAmount;
    else cardTotal -= netAmount;
    movements.push({
      at: r.refundedAt!,
      label: `Reembolso · ${r.service.name} · ${r.clientName} (${r.refundReason ?? "sin motivo"})`,
      method: `REFUND_${r.paymentMethod}`,
      amount: -netAmount,
    });
  }

  for (const m of cashMovementsInWindow) {
    const signedAmount = m.type === "INGRESO" ? m.amount : -m.amount;
    cashTotal += signedAmount;
    movements.push({
      at: m.createdAt,
      label: m.concept,
      method: m.type,
      amount: signedAmount,
    });
  }

  movements.sort((a, b) => a.at.getTime() - b.at.getTime());

  return { cashTotal, cardTotal, transferTotal, salesCount, movements };
}
