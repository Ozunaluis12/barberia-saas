"use client";

import { useState } from "react";
import { cancelAppointmentByClient } from "@/app/actions/clientCancel";

export default function CancelButton({
  appointmentId,
  noticeHours,
}: {
  appointmentId: string;
  noticeHours: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    { ok: true; wasLate: boolean } | { ok: false; error: string } | null
  >(null);

  async function handleCancel() {
    setLoading(true);
    const res = await cancelAppointmentByClient(appointmentId);
    setLoading(false);
    setResult(res);
  }

  if (result?.ok) {
    return (
      <div className="rounded-md border border-white/10 bg-ink p-4 text-sm">
        <p className="font-semibold text-cream">Cita cancelada.</p>
        {result.wasLate ? (
          <p className="mt-2 text-yellow-400">
            Cancelaste con menos de {noticeHours} horas de anticipación, así que quedó
            registrada como cancelación tardía en tu historial con este negocio.
          </p>
        ) : (
          <p className="mt-2 text-cream/60">Gracias por avisar con tiempo.</p>
        )}
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-md border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
      >
        Cancelar mi cita
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-ink p-4">
      <p className="text-sm text-cream/70">
        Se requiere avisar con al menos <span className="font-semibold text-cream">{noticeHours}
        {" "}horas</span> de anticipación. Cancelar más tarde que eso queda registrado como
        cancelación tardía.
      </p>
      {result && !result.ok && (
        <p className="text-sm text-red-400">{result.error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 rounded-md bg-red-500/90 px-4 py-2 text-sm font-semibold text-ink hover:bg-red-500 disabled:opacity-50"
        >
          {loading ? "Cancelando..." : "Sí, confirmar cancelación"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-white/20 px-4 py-2 text-sm hover:border-gold"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
