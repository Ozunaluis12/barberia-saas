"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSlots, createBooking, joinWaitlist } from "@/app/actions/booking";
import Avatar from "@/components/Avatar";

type Service = { id: string; name: string; durationMinutes: number; price: number };
type StaffMember = { id: string; name: string; photoUrl?: string | null };
type Slot = { time: string; staffId: string; staffName: string };
type Vocab = {
  staffSingular: string;
  bookingQuestion: string;
  anyStaffLabel: string;
  anyStaffDescription: string;
};

function nextDays(count: number): { value: string; label: string }[] {
  const days = [];
  const formatter = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short" });
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    days.push({ value, label: formatter.format(d) });
  }
  return days;
}

export default function BookingFlow({
  businessSlug,
  services,
  staff,
  cancellationNoticeHours,
  vocab,
}: {
  businessSlug: string;
  services: Service[];
  staff: StaffMember[];
  cancellationNoticeHours: number;
  vocab: Vocab;
}) {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null); // null = cualquiera disponible
  const [day, setDay] = useState<string>(nextDays(14)[0].value);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; staffName: string; startTime: string; appointmentId: string }
    | { ok: false; error: string }
    | null
  >(null);

  const days = useMemo(() => nextDays(14), []);
  const selectedService = services.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    if (step !== 3 || !serviceId) return;
    setLoadingSlots(true);
    setTime(null);
    setWaitlistJoined(false);
    fetchSlots({ businessSlug, serviceId, staffId, day })
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [step, serviceId, staffId, day, businessSlug]);

  async function handleJoinWaitlist() {
    if (!serviceId || !clientName.trim() || !clientPhone.trim()) return;
    setJoiningWaitlist(true);
    const res = await joinWaitlist({ businessSlug, serviceId, staffId, day, clientName, clientPhone });
    setJoiningWaitlist(false);
    if (res.ok) setWaitlistJoined(true);
  }

  async function handleConfirm() {
    if (!serviceId || !time) return;
    setSubmitting(true);
    const res = await createBooking({
      businessSlug,
      serviceId,
      staffId,
      day,
      time,
      clientName,
      clientPhone,
    });
    setSubmitting(false);
    setResult(res);
    if (res.ok) setStep(5);
  }

  if (step === 5 && result?.ok) {
    const date = new Date(result.startTime);
    return (
      <div className="rounded-lg border border-gold/40 bg-charcoal p-8 text-center">
        <h2 className="text-2xl font-bold text-gold">¡Cita confirmada!</h2>
        <p className="mt-4 text-cream/80">
          Te atenderá <span className="font-semibold text-cream">{result.staffName}</span>
        </p>
        <p className="mt-1 text-cream/80">
          {date.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })} a las{" "}
          {date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-md border border-white/10 bg-ink p-4 text-sm">
          <p className="text-cream/70">
            ¿Necesitas cancelar? Guarda este enlace, se requieren al menos{" "}
            <span className="font-semibold text-cream">{cancellationNoticeHours} horas</span> de
            anticipación o quedará registrado como cancelación tardía:
          </p>
          <a
            href={`/cita/${result.appointmentId}`}
            className="mt-2 block break-all text-gold hover:underline"
          >
            /cita/{result.appointmentId}
          </a>
        </div>
        <p className="mt-6 text-sm text-cream/50">Te esperamos. ¡Gracias por reservar!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-charcoal p-6">
      <ol className="mb-6 flex gap-2 text-xs text-cream/50">
        {["Servicio", vocab.staffSingular, "Horario", "Tus datos"].map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1 ${
              step === i + 1 ? "bg-gold text-ink font-semibold" : "bg-ink"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">¿Qué servicio quieres?</h2>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServiceId(s.id);
                setStep(2);
              }}
              className="flex w-full items-center justify-between rounded-md border border-white/10 bg-ink px-4 py-3 text-left hover:border-gold"
            >
              <span>
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-sm text-cream/50">{s.durationMinutes} min</span>
              </span>
              <span className="font-semibold text-gold">${s.price.toFixed(2)}</span>
            </button>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-cream/50">Este negocio aún no tiene servicios activos.</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{vocab.bookingQuestion}</h2>
          <button
            onClick={() => {
              setStaffId(null);
              setStep(3);
            }}
            className="flex w-full flex-col rounded-md border border-gold bg-gold/10 px-4 py-3 text-left hover:bg-gold/20"
          >
            <span className="font-medium text-gold">{vocab.anyStaffLabel}</span>
            <span className="text-xs text-cream/60">{vocab.anyStaffDescription}</span>
          </button>
          {staff.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setStaffId(s.id);
                setStep(3);
              }}
              className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-ink px-4 py-3 text-left hover:border-gold"
            >
              <Avatar src={s.photoUrl} name={s.name} size={36} />
              {s.name}
            </button>
          ))}
          <button onClick={() => setStep(1)} className="text-sm text-cream/50 hover:text-cream">
            ← Volver
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Elige día y hora</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => (
              <button
                key={d.value}
                onClick={() => setDay(d.value)}
                className={`shrink-0 rounded-md border px-3 py-2 text-sm capitalize ${
                  day === d.value
                    ? "border-gold bg-gold text-ink font-semibold"
                    : "border-white/10 bg-ink hover:border-gold"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {loadingSlots && <p className="text-sm text-cream/50">Buscando horarios...</p>}
          {!loadingSlots && slots.length === 0 && (
            <div className="space-y-3 rounded-md border border-white/10 bg-ink p-4">
              <p className="text-sm text-cream/50">No hay horarios disponibles ese día.</p>
              {waitlistJoined ? (
                <p className="text-sm text-gold">
                  Listo, te avisaremos por WhatsApp si se libera un horario ese día.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-cream/70">¿Quieres que te avisemos si se libera un horario?</p>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full rounded-md border border-white/20 bg-charcoal px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Tu teléfono"
                    className="w-full rounded-md border border-white/20 bg-charcoal px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                  <button
                    disabled={!clientName.trim() || !clientPhone.trim() || joiningWaitlist}
                    onClick={handleJoinWaitlist}
                    className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
                  >
                    {joiningWaitlist ? "Enviando..." : "Avisarme si se libera un horario"}
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {slots.map((s) => (
              <button
                key={`${s.time}-${s.staffId}`}
                onClick={() => setTime(s.time)}
                className={`rounded-md border px-2 py-2 text-sm ${
                  time === s.time
                    ? "border-gold bg-gold text-ink font-semibold"
                    : "border-white/10 bg-ink hover:border-gold"
                }`}
              >
                {s.time}
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="text-sm text-cream/50 hover:text-cream">
              ← Volver
            </button>
            <button
              disabled={!time}
              onClick={() => setStep(4)}
              className="rounded-md bg-gold px-5 py-2 font-semibold text-ink disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tus datos</h2>
          <div className="rounded-md bg-ink px-4 py-3 text-sm text-cream/70">
            {selectedService?.name} · {day} · {time}
          </div>
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Teléfono</label>
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          {result && !result.ok && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{result.error}</p>
          )}
          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(3)} className="text-sm text-cream/50 hover:text-cream">
              ← Volver
            </button>
            <button
              disabled={!clientName.trim() || !clientPhone.trim() || submitting}
              onClick={handleConfirm}
              className="rounded-md bg-gold px-5 py-2 font-semibold text-ink disabled:opacity-40"
            >
              {submitting ? "Reservando..." : "Confirmar cita"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
