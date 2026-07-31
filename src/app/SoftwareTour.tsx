"use client";

import { useEffect, useState } from "react";

export type Slide = {
  step: string;
  title: string;
  caption: string;
  content: React.ReactNode;
};

function Pill({ tone, children }: { tone: "green" | "yellow"; children: React.ReactNode }) {
  const classes =
    tone === "green" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${classes}`}>{children}</span>;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    step: "1. Reserva",
    title: "El cliente reserva solo, desde su celular",
    caption: "Elige servicio, especialista (o \"cualquiera disponible\") y horario libre — sin llamadas ni WhatsApp de ida y vuelta.",
    content: (
      <>
        <p className="text-sm font-semibold">Nueva reserva</p>
        <div className="mt-3 space-y-2 text-[10px]">
          <div className="rounded-md border border-gold bg-gold/10 px-3 py-2">
            <p className="font-medium text-gold">Corte + barba · 45 min</p>
            <p className="text-cream/60">Hoy, 3:00 PM · Andrés Ponce</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink px-3 py-2 text-cream/60">
            Confirmación instantánea por WhatsApp
          </div>
        </div>
      </>
    ),
  },
  {
    step: "2. Recordatorio",
    title: "Nadie olvida su cita",
    caption: "WhatsApp y correo salen automáticos antes de cada cita, sin que el negocio mueva un dedo.",
    content: (
      <>
        <p className="text-sm font-semibold">Recordatorio automático</p>
        <div className="mt-3 space-y-2 text-[10px]">
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="font-medium">WhatsApp · enviado</p>
            <p className="mt-1 text-cream/60">
              &ldquo;Hola Camila, te recordamos tu cita de Corte + barba hoy a las 3:00 PM.&rdquo;
            </p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="font-medium">Correo · enviado</p>
            <p className="mt-1 text-cream/60">Recordatorio: tu cita en Barbería Central</p>
          </div>
        </div>
      </>
    ),
  },
  {
    step: "3. Panel del día",
    title: "El dueño ve todo el negocio de un vistazo",
    caption: "Citas, ingresos y equipo activo en tiempo real, apenas abre el panel en la mañana.",
    content: (
      <>
        <p className="text-sm font-semibold">Resumen de hoy</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-[9px] text-cream/50">Citas hoy</p>
            <p className="text-base font-bold text-gold">12</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-[9px] text-cream/50">Ingreso hoy</p>
            <p className="text-base font-bold text-gold">$486</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-[9px] text-cream/50">Equipo activo</p>
            <p className="text-base font-bold text-gold">5</p>
          </div>
        </div>
      </>
    ),
  },
  {
    step: "4. Cobro",
    title: "El pago queda registrado en el momento",
    caption: "Efectivo, tarjeta o transferencia con comprobante — cada cita queda marcada como pagada, sin cuadres manuales al final del día.",
    content: (
      <>
        <p className="text-sm font-semibold">Cita · Marcos T.</p>
        <div className="mt-3 space-y-2 text-[10px]">
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Corte + barba · $18.000</span>
              <Pill tone="green">Pagado</Pill>
            </div>
            <p className="mt-1 text-cream/50">Efectivo · caja del turno</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2 text-cream/60">
            Recibo en PDF generado automáticamente
          </div>
        </div>
      </>
    ),
  },
  {
    step: "5. Caja y nómina",
    title: "Cierre de caja y comisiones sin hojas de cálculo",
    caption: "Al cerrar el turno, Turnify compara lo esperado contra lo contado y calcula la comisión de cada especialista por el período.",
    content: (
      <>
        <p className="text-sm font-semibold">Cierre de caja · turno tarde</p>
        <div className="mt-3 space-y-2 text-[10px]">
          <div className="flex justify-between rounded bg-ink px-2 py-1.5">
            <span>Esperado</span>
            <span className="text-cream/60">$612.000</span>
          </div>
          <div className="flex justify-between rounded bg-ink px-2 py-1.5">
            <span>Contado</span>
            <span className="text-cream/60">$612.000</span>
          </div>
          <div className="flex justify-between rounded bg-ink px-2 py-1.5">
            <span>Diferencia</span>
            <Pill tone="green">$0</Pill>
          </div>
        </div>
      </>
    ),
  },
  {
    step: "6. Fidelización",
    title: "Cada cita completada trae la siguiente",
    caption: "Reseñas, puntos por visita y referidos mantienen a los clientes volviendo, sin trabajo extra del dueño.",
    content: (
      <>
        <p className="text-sm font-semibold">Después de la cita</p>
        <div className="mt-3 space-y-2 text-[10px]">
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-gold">★★★★★</p>
            <p className="mt-1 text-cream/70">&ldquo;Excelente atención, quedé muy contenta.&rdquo;</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2 text-cream/60">
            +10 puntos de fidelidad · código de referido enviado
          </div>
        </div>
      </>
    ),
  },
];

const SLIDE_DURATION = 3200;

export default function SoftwareTour({ slides = DEFAULT_SLIDES }: { slides?: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const active = slides[index];

  return (
    <div
      className="mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-xl border border-white/10 bg-charcoal p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold">
            {active.step}
          </span>
          <span className="text-[11px] text-cream/40">
            {index + 1} / {slides.length}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-bold">{active.title}</h3>
        <p className="mt-2 text-sm text-cream/70">{active.caption}</p>

        <div className="mt-5 rounded-lg border border-white/10 bg-ink p-4 transition-opacity duration-500">
          {active.content}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.step}
            type="button"
            aria-label={`Ir al paso ${i + 1}: ${s.title}`}
            onClick={() => setIndex(i)}
            className="group relative h-1.5 w-8 overflow-hidden rounded-full bg-white/10"
          >
            <span
              key={i === index ? `active-${index}` : `idle-${i}`}
              className={`absolute inset-y-0 left-0 rounded-full bg-gold ${
                i === index ? "w-0" : i < index ? "w-full" : "w-0"
              }`}
              style={
                i === index
                  ? {
                      animation: `tourProgress ${SLIDE_DURATION}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }
                  : undefined
              }
            />
          </button>
        ))}
      </div>

      <style>{`
        @keyframes tourProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
