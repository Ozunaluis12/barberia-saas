"use client";

import { useState } from "react";
import SoftwareTour, { type Slide } from "./SoftwareTour";
import { getVocabulary, BUSINESS_CATEGORIES, type BusinessCategory } from "@/lib/vocabulary";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">
      {children}
    </span>
  );
}

function buildSlides(category: BusinessCategory): Slide[] {
  const vocab = getVocabulary(category);
  const service = vocab.servicePlaceholder;
  const staff = vocab.staffSingular.toLowerCase();

  return [
    {
      step: "1. Reserva",
      title: `El cliente reserva ${service.toLowerCase()} en segundos`,
      caption: `Elige ${service.toLowerCase()}, ${staff} de confianza (o "cualquiera disponible") y un horario libre — sin llamadas.`,
      content: (
        <>
          <p className="text-sm font-semibold">Nueva reserva</p>
          <div className="mt-3 space-y-2 text-[10px]">
            <div className="rounded-md border border-gold bg-gold/10 px-3 py-2">
              <p className="font-medium text-gold">{service}</p>
              <p className="text-cream/60">Hoy, 3:00 PM · {vocab.staffSingular} asignado</p>
            </div>
            <div className="rounded-md border border-white/10 bg-ink px-3 py-2 text-cream/60">
              Confirmación instantánea por WhatsApp
            </div>
          </div>
        </>
      ),
    },
    {
      step: "2. Agenda unificada",
      title: "Walk-ins y citas online, en la misma agenda",
      caption: `Una visita ${vocab.walkInLabel.toLowerCase()} y una reserva online conviven en el mismo horario, sin choques ni dobles reservas.`,
      content: (
        <>
          <p className="text-sm font-semibold">Agenda de hoy</p>
          <div className="mt-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between rounded bg-ink px-2 py-1.5">
              <span>10:00 · Marcos T.</span>
              <span className="text-cream/50">Online</span>
            </div>
            <div className="flex justify-between rounded bg-ink px-2 py-1.5">
              <span>10:30 · Julia P.</span>
              <span className="text-cream/50">{vocab.walkInLabel}</span>
            </div>
          </div>
        </>
      ),
    },
    {
      step: "3. Recordatorio",
      title: "Nadie olvida su cita",
      caption: "WhatsApp y correo salen automáticos antes de cada cita, sin que el negocio mueva un dedo.",
      content: (
        <>
          <p className="text-sm font-semibold">Recordatorio automático</p>
          <div className="mt-3 space-y-2 text-[10px]">
            <div className="rounded-md border border-white/10 bg-ink p-2">
              <p className="font-medium">WhatsApp · enviado</p>
              <p className="mt-1 text-cream/60">
                &ldquo;Te recordamos tu cita de {service.toLowerCase()} hoy a las 3:00 PM.&rdquo;
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      step: "4. Lista de espera",
      title: "Si no hay cupo, el cliente no se pierde",
      caption: "Pide que le avisen por WhatsApp si se libera un horario ese día — apenas se cancela una cita que calce, se le notifica solo.",
      content: (
        <>
          <p className="text-sm font-semibold">Lista de espera</p>
          <div className="mt-3 rounded-md border border-white/10 bg-ink p-2 text-[10px]">
            <p className="font-medium">Ana T. · quiere {service.toLowerCase()} hoy</p>
            <p className="mt-1 text-cream/60">Avisada automáticamente al liberarse un cupo a las 4:00 PM</p>
          </div>
        </>
      ),
    },
    {
      step: "5. Cupones",
      title: "Promociones que se aplican solas",
      caption: "El cliente escribe un código al reservar y el descuento se aplica al instante, sin que nadie lo autorice a mano.",
      content: (
        <>
          <p className="text-sm font-semibold">Código de descuento</p>
          <div className="mt-3 flex items-center justify-between rounded-md border border-gold bg-gold/10 px-3 py-2 text-[10px]">
            <span className="font-medium text-gold">BIENVENIDO20</span>
            <span className="text-cream/60">-20% aplicado</span>
          </div>
        </>
      ),
    },
    {
      step: "6. Caja y pagos",
      title: "Cada pago queda registrado al momento",
      caption: "Efectivo, tarjeta o transferencia — la cita queda marcada como pagada al instante, con comprobante en PDF.",
      content: (
        <>
          <p className="text-sm font-semibold">Cita · {service}</p>
          <div className="mt-3 space-y-2 text-[10px]">
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-ink p-2">
              <span className="font-medium">$18.000</span>
              <Pill>Pagado</Pill>
            </div>
            <div className="rounded-md border border-white/10 bg-ink p-2 text-cream/60">
              Recibo en PDF generado automáticamente
            </div>
          </div>
        </>
      ),
    },
    {
      step: "7. Comisiones",
      title: "La comisión de cada persona se calcula sola",
      caption: `Al cerrar el período, Turnify suma lo que generó cada ${staff} y congela el pago — sin recalcular ni pagar dos veces.`,
      content: (
        <>
          <p className="text-sm font-semibold">Nómina · quincena</p>
          <div className="mt-3 space-y-1.5 text-[10px]">
            <div className="flex justify-between rounded bg-ink px-2 py-1.5">
              <span>{vocab.staffSingular} asignado</span>
              <span className="text-cream/60">$612.000 generado</span>
            </div>
            <div className="flex justify-between rounded bg-ink px-2 py-1.5">
              <span>Comisión (40%)</span>
              <span className="font-semibold text-gold">$244.800</span>
            </div>
          </div>
        </>
      ),
    },
    {
      step: "8. Reportes",
      title: "Sabes qué está funcionando, sin hojas de cálculo",
      caption: "Horas pico, servicios más vendidos y qué porcentaje de tus clientes vuelve — todo calculado solo.",
      content: (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-[9px] text-cream/50">Hora pico</p>
            <p className="text-base font-bold text-gold">4-6pm</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-[9px] text-cream/50">Más vendido</p>
            <p className="text-[11px] font-bold text-gold">{service}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-ink p-2">
            <p className="text-[9px] text-cream/50">Recurrencia</p>
            <p className="text-base font-bold text-gold">68%</p>
          </div>
        </div>
      ),
    },
    {
      step: "9. Fidelización",
      title: "Cada cita completada trae la siguiente",
      caption: "Reseñas, puntos por visita y referidos mantienen a los clientes volviendo.",
      content: (
        <>
          <p className="text-sm font-semibold">Después de la cita</p>
          <div className="mt-3 space-y-2 text-[10px]">
            <div className="rounded-md border border-white/10 bg-ink p-2">
              <p className="text-gold">★★★★★</p>
              <p className="mt-1 text-cream/70">&ldquo;Excelente atención, quedé muy contento.&rdquo;</p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/10 bg-ink p-2 text-cream/60">
              <span>+10 puntos de fidelidad</span>
              <Pill>Referido enviado</Pill>
            </div>
          </div>
        </>
      ),
    },
  ];
}

export default function DemoTour() {
  const [category, setCategory] = useState<BusinessCategory>("BARBERSHOP");

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {BUSINESS_CATEGORIES.map((key) => {
          const label = getVocabulary(key).categoryLabel;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                category === key
                  ? "bg-gold text-ink"
                  : "border border-white/10 text-cream/70 hover:border-gold hover:text-gold"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <SoftwareTour key={category} slides={buildSlides(category)} />
      </div>
    </div>
  );
}
