"use client";

import { useEffect, useState } from "react";
import { getWalkInSlots } from "@/app/actions/appointments";
import { createWalkIn } from "@/app/actions/appointments";

type Service = { id: string; name: string };
type StaffMember = { id: string; name: string };
type Slot = { time: string; staffId: string; staffName: string };
type Vocab = { staffSingular: string; walkInLabel: string };

export default function WalkInForm({
  services,
  staff,
  vocab,
}: {
  services: Service[];
  staff: StaffMember[];
  vocab: Vocab;
}) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffChoice, setStaffChoice] = useState<string>("ANY");
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [chosenSlot, setChosenSlot] = useState<Slot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !serviceId) return;
    setChosenSlot(null);
    getWalkInSlots({
      serviceId,
      staffId: staffChoice === "ANY" ? null : staffChoice,
      day,
    } as never).then(setSlots);
  }, [open, serviceId, staffChoice, day]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosenSlot || !clientName.trim()) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("staffId", chosenSlot.staffId);
    fd.set("serviceId", serviceId);
    fd.set("clientName", clientName);
    fd.set("clientPhone", clientPhone);
    fd.set("day", day);
    fd.set("time", chosenSlot.time);
    const result = await createWalkIn(fd);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      // Volvemos a cargar los horarios: lo más probable es que alguien más se haya
      // adelantado y ese hueco ya no exista.
      setChosenSlot(null);
      getWalkInSlots({
        serviceId,
        staffId: staffChoice === "ANY" ? null : staffChoice,
        day,
      } as never).then(setSlots);
      return;
    }
    setOpen(false);
    setClientName("");
    setClientPhone("");
    setChosenSlot(null);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
      >
        + Agregar {vocab.walkInLabel.toLowerCase()}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 max-w-lg space-y-4 rounded-lg border border-white/10 bg-charcoal p-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Nuevo {vocab.walkInLabel.toLowerCase()}</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-cream/50">
          Cancelar
        </button>
      </div>

      <div>
        <label className="text-sm text-cream/70">Servicio</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-cream/70">{vocab.staffSingular}</label>
        <select
          value={staffChoice}
          onChange={(e) => setStaffChoice(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2"
        >
          <option value="ANY">Cualquiera disponible</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-cream/70">Fecha</label>
        <input
          type="date"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2"
        />
      </div>

      <div>
        <label className="text-sm text-cream/70">Horario disponible</label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {slots.map((s) => (
            <button
              type="button"
              key={`${s.time}-${s.staffId}`}
              onClick={() => setChosenSlot(s)}
              className={`rounded-md border px-2 py-2 text-sm ${
                chosenSlot?.time === s.time && chosenSlot?.staffId === s.staffId
                  ? "border-gold bg-gold text-ink font-semibold"
                  : "border-white/10 bg-ink hover:border-gold"
              }`}
              title={s.staffName}
            >
              {s.time}
            </button>
          ))}
          {slots.length === 0 && <p className="col-span-4 text-sm text-cream/50">Sin horarios libres.</p>}
        </div>
        {chosenSlot && (
          <p className="mt-1 text-xs text-cream/50">
            {vocab.staffSingular} asignado: {chosenSlot.staffName}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm text-cream/70">Cliente</label>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm text-cream/70">Teléfono (opcional)</label>
        <input
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!chosenSlot || loading}
        className="rounded-md bg-gold px-4 py-2 font-semibold text-ink disabled:opacity-40"
      >
        {loading ? "Guardando..." : `Registrar ${vocab.walkInLabel.toLowerCase()}`}
      </button>
    </form>
  );
}
