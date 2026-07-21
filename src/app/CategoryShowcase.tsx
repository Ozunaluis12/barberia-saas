"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export type CategoryInfo = {
  icon: IconName;
  title: string;
  summary: string;
  details: string;
  features: string[];
};

export const CATEGORIAS: CategoryInfo[] = [
  {
    icon: "barberpole",
    title: "Barbería",
    summary:
      "Tus clientes reservan su corte online y eligen a su barbero de confianza. Controla comisiones y walk-ins desde el mismo panel.",
    details:
      "Cada barbero tiene su propio horario y comisión configurada. Tus clientes reservan online eligiendo con quién cortarse — o dejan que el sistema asigne al barbero disponible más pronto, repartiendo la carga de forma justa. Los walk-ins y las reservas online conviven en la misma agenda, sin choques de horario.",
    features: [
      "Comisión por barbero, calculada automáticamente",
      "Walk-ins y citas online en el mismo calendario",
      "Historial de clientes con cancelaciones tardías",
      "Reseñas después de cada corte",
    ],
  },
  {
    icon: "mirror",
    title: "Salón de belleza",
    summary:
      "Agenda cortes, color y tratamientos con cada estilista. Tus clientas ven horarios reales y reservan en segundos.",
    details:
      "Organiza a tu equipo de estilistas por servicio y disponibilidad. Cada clienta ve en tiempo real quién está libre y a qué hora, y puede elegir su estilista de confianza para color, corte o tratamientos, o dejar que el sistema le asigne a la persona disponible más pronto.",
    features: [
      "Servicios con duración y precio configurables",
      "Cada estilista con su propio horario",
      "Reportes de desempeño por persona",
      "Reseñas visibles para nuevas clientas",
    ],
  },
  {
    icon: "leaf",
    title: "Spa",
    summary:
      "Organiza masajes, faciales y tratamientos por especialista, sin choques de horario ni llamadas de ida y vuelta.",
    details:
      "Coordina masajes, faciales y tratamientos por especialista sin que se crucen los horarios. Ideal para spas con varios terapeutas atendiendo en paralelo, con duraciones distintas para cada tipo de sesión.",
    features: [
      "Duración distinta por tipo de tratamiento",
      "Balanceo automático de carga entre especialistas",
      "Pagos en efectivo o tarjeta registrados por cita",
      "Recordatorios configurables antes de la sesión",
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
        {CATEGORIAS.map((c) => (
          <button
            key={c.title}
            onClick={() => setSelected(c)}
            className="rounded-lg border border-white/10 bg-ink p-6 text-left transition hover:border-gold"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
              <CategoryIcon name={c.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-cream/70">{c.summary}</p>
            <span className="mt-3 inline-block text-xs font-semibold text-gold">
              Ver más →
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-charcoal p-6 shadow-2xl"
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

            <ul className="mt-4 space-y-2 text-sm text-cream/80">
              {selected.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-gold">✓</span>
                  {f}
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
                className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90"
              >
                Programar demostración por WhatsApp
              </a>
              <Link
                href="/signup"
                className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold hover:border-gold hover:text-gold"
              >
                Crear mi negocio gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
