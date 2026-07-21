"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const WHATSAPP_NUMBER = "573004177979";
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

type IconName =
  | "scissors"
  | "comb"
  | "droplet"
  | "pulse"
  | "paw"
  | "wrench"
  | "dumbbell"
  | "calendar";

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
    case "scissors":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case "comb":
      return (
        <svg {...common}>
          <path d="M4 4h16v4H4z" />
          <line x1="6" y1="8" x2="6" y2="20" />
          <line x1="10" y1="8" x2="10" y2="20" />
          <line x1="14" y1="8" x2="14" y2="20" />
          <line x1="18" y1="8" x2="18" y2="20" />
        </svg>
      );
    case "droplet":
      return (
        <svg {...common}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "paw":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="16.5" rx="5" ry="4" />
          <circle cx="5.5" cy="9" r="2" />
          <circle cx="10.5" cy="5.5" r="2" />
          <circle cx="15.5" cy="5.5" r="2" />
          <circle cx="20" cy="9" r="2" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...common}>
          <line x1="6.5" y1="12" x2="17.5" y2="12" />
          <rect x="2" y="8" width="3.5" height="8" rx="1" />
          <rect x="18.5" y="8" width="3.5" height="8" rx="1" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M9 15.5l2 2 4-4.5" />
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
    icon: "scissors",
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
    icon: "comb",
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
    icon: "droplet",
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
  {
    icon: "pulse",
    title: "Consultorio médico",
    summary:
      "Tus pacientes agendan consulta con el doctor que prefieren. Recordatorios automáticos para bajar las inasistencias.",
    details:
      "Tus pacientes agendan consulta con el doctor o la doctora que prefieren, o el sistema asigna a quien esté disponible más pronto. Los recordatorios automáticos ayudan a reducir las inasistencias, y cada consulta sin cita previa queda registrada igual que una reserva en línea.",
    features: [
      "Vocabulario médico: doctor/a, paciente, consulta",
      "Consultas sin cita para casos urgentes",
      "Historial de inasistencias por paciente",
      "Recordatorios antes de cada cita",
    ],
  },
  {
    icon: "paw",
    title: "Veterinaria",
    summary:
      "Agenda consultas y vacunas por veterinario. Historial de cada mascota y su dueño, siempre a la mano.",
    details:
      "Agenda consultas, vacunas y controles por veterinario. El historial de cada cliente queda registrado y visible para cualquier veterinario del equipo antes de confirmar otra cita, sin importar quién atendió la vez anterior.",
    features: [
      "Historial compartido entre todo el equipo",
      "Consultas sin cita para urgencias",
      "Servicios con precio y duración propios",
      "Reseñas de dueños de mascotas",
    ],
  },
  {
    icon: "wrench",
    title: "Taller",
    summary:
      "Recibe citas para mantenimiento y reparaciones por técnico. Controla tiempos de servicio y evita la fila en el mostrador.",
    details:
      "Recibe vehículos para mantenimiento o reparación con cita previa o por orden de llegada, asignando al técnico disponible. Controla cuánto dura cada servicio y lleva el registro de qué se cobró y cómo.",
    features: [
      "Duración configurable por tipo de trabajo",
      "Asignación automática al técnico más disponible",
      "Registro de pagos en efectivo o tarjeta",
      "Historial de clientes recurrentes",
    ],
  },
  {
    icon: "dumbbell",
    title: "Gimnasio",
    summary:
      "Agenda clases y sesiones personalizadas por entrenador. Tus clientes reservan su cupo desde el celular.",
    details:
      "Agenda clases grupales o sesiones personalizadas con cada entrenador. Tus clientes reservan su cupo desde el celular, sin llamadas ni mensajes manuales, y tú ves el desempeño de cada entrenador en un solo reporte.",
    features: [
      "Reserva de cupo por entrenador o clase",
      "Balanceo de carga entre entrenadores",
      "Reseñas después de cada sesión",
      "Reportes de asistencia y desempeño",
    ],
  },
  {
    icon: "calendar",
    title: "Y cualquier negocio con citas",
    summary:
      "¿Tu negocio no está en la lista? Si trabajas con citas y un equipo, Turnify se adapta a tu operación.",
    details:
      "Turnify no está atado a un solo rubro: si tu negocio agenda citas con un equipo de personas, la plataforma se adapta a tu operación sin necesitar una versión especial ni desarrollo a la medida.",
    features: [
      "Vocabulario configurable para tu tipo de negocio",
      "Servicios y horarios totalmente personalizables",
      "Mismo panel para cualquier tipo de cita",
      "Listo para crecer a varias sucursales",
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
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
