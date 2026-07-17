import { prisma } from "@/lib/db";

const SLOT_STEP_MINUTES = 15;

export type Slot = {
  time: string; // "HH:mm"
  barberId: string;
  barberName: string;
};

function parseHHMM(value: string): { h: number; m: number } {
  const [h, m] = value.split(":").map(Number);
  return { h, m };
}

function dateAt(day: string, hhmm: string): Date {
  const { h, m } = parseHHMM(hhmm);
  const d = new Date(`${day}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
}

function minutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Franjas libres de un barbero concreto para un día y duración de servicio dados. */
async function freeSlotsForBarber(
  barberId: string,
  workStart: string,
  workEnd: string,
  workDays: string,
  day: string,
  durationMinutes: number
): Promise<string[]> {
  const dow = new Date(`${day}T12:00:00`).getDay();
  if (!workDays.split(",").map(Number).includes(dow)) return [];

  const dayStart = dateAt(day, workStart);
  const dayEnd = dateAt(day, workEnd);

  const existing = await prisma.appointment.findMany({
    where: {
      barberId,
      status: { not: "CANCELLED" },
      startTime: { gte: dayStart, lt: dayEnd },
    },
    select: { startTime: true, endTime: true },
  });

  const now = new Date();
  const slots: string[] = [];
  const startMinutes = dayStart.getHours() * 60 + dayStart.getMinutes();
  const endMinutes = dayEnd.getHours() * 60 + dayEnd.getMinutes();

  for (let t = startMinutes; t + durationMinutes <= endMinutes; t += SLOT_STEP_MINUTES) {
    const slotStart = new Date(dayStart);
    slotStart.setHours(0, 0, 0, 0);
    slotStart.setMinutes(t);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    if (slotStart < now) continue;

    const overlaps = existing.some(
      (a) => slotStart < a.endTime && slotEnd > a.startTime
    );
    if (!overlaps) slots.push(minutesToHHMM(t));
  }

  return slots;
}

/**
 * Disponibilidad para un día: si se pide un barbero específico, sus huecos libres.
 * Si barberId es null ("cualquiera disponible"), fusiona los huecos de todos los
 * barberos activos y, para cada hueco, asigna el barbero con menos citas ese día
 * (balanceo de carga) para que ningún barbero quede siempre de último recurso.
 */
export async function getAvailableSlots(params: {
  shopId: string;
  serviceId: string;
  barberId: string | null;
  day: string; // YYYY-MM-DD
}): Promise<Slot[]> {
  const { shopId, serviceId, barberId, day } = params;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, shopId },
  });
  if (!service) return [];

  const barbers = await prisma.barber.findMany({
    where: {
      shopId,
      active: true,
      ...(barberId ? { id: barberId } : {}),
    },
  });
  if (barbers.length === 0) return [];

  const dayStart = new Date(`${day}T00:00:00`);
  const dayEnd = new Date(`${day}T23:59:59`);

  const loadCounts = new Map<string, number>();
  for (const b of barbers) {
    const count = await prisma.appointment.count({
      where: {
        barberId: b.id,
        status: { not: "CANCELLED" },
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });
    loadCounts.set(b.id, count);
  }

  const perBarberSlots = await Promise.all(
    barbers.map(async (b) => ({
      barber: b,
      times: await freeSlotsForBarber(
        b.id,
        b.workStart,
        b.workEnd,
        b.workDays,
        day,
        service.durationMinutes
      ),
    }))
  );

  const byTime = new Map<string, { barberId: string; barberName: string }[]>();
  for (const { barber, times } of perBarberSlots) {
    for (const t of times) {
      const list = byTime.get(t) ?? [];
      list.push({ barberId: barber.id, barberName: barber.name });
      byTime.set(t, list);
    }
  }

  const result: Slot[] = [];
  const sortedTimes = Array.from(byTime.keys()).sort();
  for (const t of sortedTimes) {
    const candidates = byTime.get(t)!;
    const chosen = candidates.sort(
      (a, b) => (loadCounts.get(a.barberId) ?? 0) - (loadCounts.get(b.barberId) ?? 0)
    )[0];
    result.push({ time: t, barberId: chosen.barberId, barberName: chosen.barberName });
  }

  return result;
}

export function combineDayAndTime(day: string, time: string): Date {
  return dateAt(day, time);
}
