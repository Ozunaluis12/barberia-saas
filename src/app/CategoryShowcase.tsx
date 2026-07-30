"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";

const WHATSAPP_NUMBER = "573004177979";
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

type IconName = "barberpole" | "mirror" | "leaf";

function CategoryIcon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "barberpole":
      return (
        <svg {...common}>
          <rect x="8" y="2" width="8" height="3" rx="1.2" />
          <rect x="8" y="19" width="8" height="3" rx="1.2" />
          <rect x="9" y="5" width="6" height="14" rx="3" />
          <path d="M9 8l6 3M9 13l6 3" />
        </svg>
      );
    case "mirror":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="6" />
          <path d="M12 15v6M9 21h6" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M12 20c-4.4-1-8-5-8-10a8 8 0 0 1 8-8c4.4 0 8 3.6 8 8 0 5-3.6 9-8 10z" />
          <path d="M12 20V4" />
        </svg>
      );
  }
}

export type CategoryFeature = {
  title: string;
  detail: string;
};

export type CategoryInfo = {
  icon: IconName;
  title: string;
  summary: string;
  details: string;
  features: CategoryFeature[];
};

export const CATEGORIAS: CategoryInfo[] = [
  {
    icon: "barberpole",
    title: "Barbería",
    summary:
      "Tus clientes reservan su corte online y eligen a su barbero de confianza. Controla comisiones y walk-ins desde el mismo panel.",
    details:
      "Los walk-ins y las reservas online conviven en la misma agenda, sin choques de horario. El cliente elige a su barbero de confianza o deja que el sistema asigne automáticamente a quien tenga menos carga ese día, distribuyendo el trabajo de forma equitativa entre todo el equipo.",
    features: [
      {
        title: "Comisión calculada por barbero",
        detail:
          "El sistema calcula automáticamente lo que corresponde a cada barbero según sus cortes realizados, sin planillas manuales.",
      },
      {
        title: "Control de cancelaciones y ausencias",
        detail:
          "Registra automáticamente al cliente que cancela tarde o no se presenta, visible para todo el equipo antes de confirmarle otra cita.",
      },
      {
        title: "Reseña después de cada corte",
        detail:
          "El cliente califica su experiencia al finalizar, construyendo la reputación de cada barbero dentro de la plataforma.",
      },
      {
        title: "Un panel para todo el equipo",
        detail:
          "Cada barbero ve su agenda del día al ingresar; tú ves el negocio completo desde el mismo lugar.",
      },
    ],
  },
  {
    icon: "mirror",
    title: "Salón de belleza",
    summary:
      "Agenda cortes, color y tratamientos con cada estilista. Tus clientas ven horarios reales y reservan en segundos.",
    details:
      "Cada clienta ve en tiempo real qué estilista está disponible y a qué hora, y puede elegir a su especialista de confianza para color, corte o tratamientos — o dejar que el sistema le asigne a la persona disponible más pronto.",
    features: [
      {
        title: "Servicios con duración y precio propios",
        detail:
          "Cada tratamiento define su tiempo y tarifa, para que el calendario nunca subestime cuánto ocupa una cita.",
      },
      {
        title: "Horario independiente por estilista",
        detail:
          "Cada estilista administra su propia disponibilidad sin afectar la agenda del resto del equipo.",
      },
      {
        title: "Reporte de desempeño por estilista",
        detail:
          "Ingresos, citas atendidas y reseñas de cada persona, visibles para ti en tiempo real.",
      },
      {
        title: "Reseñas visibles antes de reservar",
        detail:
          "Nuevas clientas ven la calificación de cada estilista antes de elegir con quién agendar.",
      },
    ],
  },
  {
    icon: "leaf",
    title: "Spa",
    summary:
      "Organiza masajes, faciales y tratamientos por especialista, sin choques de horario ni llamadas de ida y vuelta.",
    details:
      "Coordina masajes, faciales y tratamientos por especialista sin que se cruce ningún horario, incluso con varios terapeutas atendiendo sesiones de distinta duración en paralelo.",
    features: [
      {
        title: "Duración configurable por tratamiento",
        detail:
          "Cada tipo de sesión define su propio tiempo, evitando que una cita larga choque con la siguiente.",
      },
      {
        title: "Distribución equilibrada de la carga",
        detail:
          "El sistema asigna nuevas reservas al terapeuta disponible con menos carga, repartiendo el trabajo de forma justa.",
      },
      {
        title: "Registro de pagos por cita",
        detail:
          "Cada sesión queda marcada como pagada en efectivo o tarjeta, sin control aparte.",
      },
      {
        title: "Recordatorios antes de la sesión",
        detail:
          "Reduce ausencias avisando al cliente con anticipación configurable.",
      },
    ],
  },
];

export default function CategoryShowcase() {
  const [selected, setSelected] = useState<CategoryInfo | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {CATEGORIAS.map((c, i) => (
          <Reveal key={c.title} delay={i * 120}>
            <button
              onClick={() => setSelected(c)}
              className="group h-full w-full rounded-lg border border-white/10 bg-ink p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-gold/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold transition-all duration-300 group-hover:scale-110 group-hover:bg-gold/25">
                <CategoryIcon name={c.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-cream/70">{c.summary}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-gold transition-transform duration-300 group-hover:translate-x-1">
                Ver más →
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-fadeIn"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-charcoal p-6 shadow-2xl animate-modalIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <CategoryIcon name={selected.icon} className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-cream">{selected.title}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Cerrar"
                className="text-xl leading-none text-cream/50 hover:text-cream"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm text-cream/80">{selected.details}</p>

            <ul className="mt-4 space-y-3 text-sm">
              {selected.features.map((f) => (
                <li key={f.title} className="flex gap-2">
                  <span className="mt-0.5 text-gold">✓</span>
                  <span>
                    <span className="font-medium text-cream">{f.title}</span>
                    <span className="block text-cream/60">{f.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={waLink(
                  `Hola, quiero programar una demostración de Turnify para mi negocio de ${selected.title.toLowerCase()}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink transition-all duration-300 hover:scale-105 hover:bg-gold/90"
              >
                Programar demostración por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
