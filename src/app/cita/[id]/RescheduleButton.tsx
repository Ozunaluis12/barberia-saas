"use client";

import { useEffect, useState } from "react";
import { fetchReschedulableSlots, rescheduleAppointmentByClient } from "@/app/actions/clientCancel";

export default function RescheduleButton({
  appointmentId,
  noticeHours,
}: {
  appointmentId: string;
  noticeHours: number;
}) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ time: string }[]>([]);
  const [chosenTime, setChosenTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: true; newStartTime: string } | { ok: false; error: string } | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    setChosenTime(null);
    setLoadingSlots(true);
    fetchReschedulableSlots(appointmentId, day)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [open, day, appointmentId]);

  async function handleConfirm() {
    if (!chosenTime) return;
    setSubmitting(true);
    const res = await rescheduleAppointmentByClient(appointmentId, day, chosenTime);
    setSubmitting(false);
    setResult(res);
  }

  if (result?.ok) {
    return (
      <div className="rounded-md border border-white/10 bg-ink p-4 text-sm">
        <p className="font-semibold text-cream">¡Cita reprogramada!</p>
        <p className="mt-2 text-cream/60">
          Tu nueva cita es el{" "}
          {new Date(result.newStartTime).toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          a las{" "}
          {new Date(result.newStartTime).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-gold/40 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
      >
        Reprogramar mi cita
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-ink p-4">
      <p className="text-sm text-cream/70">
        Se requiere al menos{" "}
        <span className="font-semibold text-cream">
          {noticeHours} horas
        </span>{" "}
        de anticipación para reprogramar.
      </p>

      <div>
        <label className="text-xs text-cream/60">Nueva fecha</label>
        <input
          type="date"
          value={day}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDay(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-charcoal px-3 py-2 text-sm outline-none focus:border-gold"
        />
      </div>

      <div>
        <label className="text-xs text-cream/60">Horario disponible</label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((s) => (
            <button
              key={s.time}
              type="button"
              onClick={() => setChosenTime(s.time)}
              className={`rounded-md border px-2 py-2 text-sm ${
                chosenTime === s.time
                  ? "border-gold bg-gold text-ink font-semibold"
                  : "border-white/10 bg-charcoal hover:border-gold"
              }`}
            >
              {s.time}
            </button>
          ))}
          {!loadingSlots && slots.length === 0 && (
            <p className="col-span-4 text-sm text-cream/50">Sin horarios libres ese día.</p>
          )}
        </div>
      </div>

      {result && !result.ok && <p className="text-sm text-red-400">{result.error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={!chosenTime || submitting}
          className="flex-1 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90 disabled:opacity-50"
        >
          {submitting ? "Reprogramando..." : "Confirmar nuevo horario"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-white/20 px-4 py-2 text-sm hover:border-gold"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
