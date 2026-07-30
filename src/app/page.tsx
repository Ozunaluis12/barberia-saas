import Link from "next/link";
import CategoryShowcase from "./CategoryShowcase";
import Reveal from "./Reveal";
import Counter from "./Counter";
import NavDropdown from "./NavDropdown";
import SoftwareTour from "./SoftwareTour";

const WHATSAPP_NUMBER = "573004177979";
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const BENEFICIOS = [
  {
    icon: "$",
    title: "Cero comisiones ocultas",
    detail:
      "Precio plano por negocio. Nunca te cobramos un porcentaje sobre las ventas que ya eran tuyas.",
  },
  {
    icon: "⚖",
    title: "El cliente elige a su especialista",
    detail:
      "O deja que el sistema asigne automáticamente a quien esté disponible con menos carga de trabajo ese día, repartiendo las citas de forma justa entre todo el equipo.",
  },
  {
    icon: "⏱",
    title: "Citas sin cita previa y online en el mismo calendario",
    detail:
      "Una visita sin cita y una reserva online conviven en el mismo horario, sin choques ni dobles reservas.",
  },
  {
    icon: "★",
    title: "Reseñas, reportes y pagos en un solo lugar",
    detail:
      "Tus clientes dejan reseña después de cada cita, tú ves el desempeño de tu equipo y llevas el control de qué se pagó y cómo — sin hojas de cálculo aparte.",
  },
  {
    icon: "⚙",
    title: "Se adapta al vocabulario de tu rubro",
    detail:
      "Barbero, estilista o especialista... el panel y la reserva usan el término correcto según seas barbería, salón de belleza o spa.",
  },
  {
    icon: "⚑",
    title: "Historial de sanciones por cliente",
    detail:
      "Si un cliente cancela tarde o no se presenta, queda registrado automáticamente y visible para todo el equipo antes de confirmarle otra cita.",
  },
];

const STATS: Array<
  | { kind: "counter"; target: number; suffix?: string; label: string }
  | { kind: "static"; display: string; label: string }
> = [
  { kind: "counter", target: 0, suffix: "%", label: "de comisión por venta" },
  { kind: "static", display: "24/7", label: "reservas en línea" },
  { kind: "counter", target: 3, label: "rubros especializados" },
  { kind: "counter", target: 1, label: "panel para todo tu equipo" },
];

const PLANES = [
  {
    name: "Básico",
    price: "$69.900",
    period: "/mes por sucursal",
    tagline: "La base operativa para un negocio que recién organiza su agenda.",
    highlight: false,
    features: [
      "Equipo y reservas online ilimitadas",
      "Walk-ins y citas online en el mismo calendario",
      "Comisión automática por especialista",
      "Reseñas y reportes de desempeño",
      "Historial de clientes con sanciones por cancelación tardía",
    ],
  },
  {
    name: "Profesional",
    price: "$149.900",
    period: "/mes por sucursal",
    tagline: "Para negocios que quieren fidelizar clientes y automatizar procesos.",
    highlight: true,
    features: [
      "Todo lo del plan Básico",
      "Programa de fidelización por puntos",
      "Control de inventario de productos",
      "Recordatorios y difusión masiva por WhatsApp",
      "Lista de espera y citas recurrentes",
      "Analítica de horas pico y productos más vendidos",
      "Nómina por período de pago",
    ],
  },
  {
    name: "Multi-sucursal",
    price: "$199.900",
    period: "/mes por sucursal",
    tagline: "Para cadenas que administran varias ubicaciones desde una sola cuenta.",
    highlight: false,
    features: [
      "Todo lo del plan Profesional",
      "Varias sucursales bajo una misma organización",
      "Calendario consolidado de todas las sucursales",
      "Permisos granulares por cuenta de personal",
    ],
  },
];

const PASOS = [
  {
    title: "El cliente reserva en segundos",
    detail:
      "Elige servicio, elige con quién (o deja que el sistema asigne) y confirma. Sin llamadas, sin mensajes de ida y vuelta.",
  },
  {
    title: "Tu equipo ve todo en un solo calendario",
    detail:
      "Citas online y visitas sin cita previa conviven sin choques. Cada quien ve su agenda del día apenas entra al panel.",
  },
  {
    title: "Tú ves el negocio completo",
    detail:
      "Ingresos del día, desempeño por especialista, pagos, reseñas y clientes con historial — todo en tiempo real, sin hojas de cálculo.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto mb-3 w-fit rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-widest text-gold">
      {children}
    </p>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-charcoal p-4 shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold/10">
      {children}
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "green" | "yellow"; children: React.ReactNode }) {
  const classes =
    tone === "green"
      ? "bg-green-500/20 text-green-400"
      : "bg-yellow-500/20 text-yellow-400";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] ${classes}`}>{children}</span>;
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-ink text-cream">
      <header className="fixed inset-x-0 top-4 z-40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <span className="rounded-full border border-white/10 bg-charcoal/90 px-5 py-2.5 text-xl font-bold tracking-tight text-gold shadow-lg shadow-black/30 backdrop-blur-md">
              Turnify
            </span>
            <nav className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-charcoal/90 px-2 py-1.5 shadow-lg shadow-black/30 backdrop-blur-md md:justify-start">
              <NavDropdown
                label="Producto"
                items={[
                  { label: "Cómo funciona", href: "#proceso" },
                  { label: "Panel en vivo", href: "#producto" },
                  { label: "Funcionalidades", href: "#funcionalidades" },
                  { label: "Ver demo de reserva", href: "/book/demo-barberia" },
                ]}
              />
              <Link
                href="#precios"
                className="rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold"
              >
                Planes
              </Link>
              <NavDropdown
                label="Categorías"
                items={[
                  { label: "Barbería", href: "#categorias" },
                  { label: "Salón de belleza", href: "#categorias" },
                  { label: "Spa", href: "#categorias" },
                ]}
              />
            </nav>
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-start">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-charcoal/90 px-2 py-1.5 shadow-lg shadow-black/30 backdrop-blur-md">
              <a
                href={waLink("Hola, necesito ayuda con Turnify.")}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold md:inline"
              >
                Soporte
              </a>
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold"
              >
                Iniciar sesión
              </Link>
            </div>
            <a
              href={waLink("Hola, quiero solicitar acceso a Turnify para mi negocio.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gradient-to-r from-gold to-amber-300 px-5 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105 hover:shadow-gold/40"
            >
              Solicitar acceso
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blobMove rounded-full bg-gold/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-40 h-80 w-80 animate-blobMove rounded-full bg-gold/10 blur-3xl [animation-delay:-6s]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-48 md:pt-32 lg:grid-cols-2">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              Agenda de citas para barberías, salones y spas
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
              El software de citas para tu barbería, salón o spa,{" "}
              <span className="bg-gradient-to-r from-gold via-yellow-200 to-gold bg-[length:200%_auto] bg-clip-text text-transparent [animation:gradientMove_5s_ease_infinite]">
                sin comisiones que te roben tus ganancias
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-cream/80">
              Tus clientes eligen con quién quieren su cita — o dejan que Turnify asigne al
              especialista disponible más justo ese día. Tú administras personal, servicios,
              citas sin previa cita, pagos y reseñas desde un solo panel.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={waLink("Hola, quiero solicitar acceso a Turnify para mi negocio.")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-gold px-6 py-3 font-semibold text-ink transition-all duration-300 hover:scale-105 hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/30 active:scale-95"
              >
                Solicitar acceso
              </a>
              <Link
                href="/book/demo-barberia"
                className="rounded-md border border-white/20 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 hover:border-gold hover:text-gold"
              >
                Probar reserva de cliente
              </Link>
            </div>
            <p className="mt-4 text-sm text-cream/50">
              Te ayudamos a activarlo — escríbenos y coordinamos el plan que mejor se ajuste a tu
              negocio.
            </p>
          </Reveal>

          <Reveal delay={150} className="mx-auto w-full max-w-sm">
            <div className="animate-floatSlow">
              <BrowserFrame>
                <ol className="mb-4 flex gap-1.5 text-[10px] text-cream/50">
                  {["Servicio", "Especialista", "Horario", "Tus datos"].map((label, i) => (
                    <li
                      key={label}
                      className={`rounded-full px-2 py-1 transition-colors ${
                        i === 1 ? "bg-gold font-semibold text-ink" : "bg-ink"
                      }`}
                    >
                      {i + 1}. {label}
                    </li>
                  ))}
                </ol>
                <p className="text-sm font-semibold">¿Con quién prefieres tu cita?</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-md border border-gold bg-gold/10 px-3 py-2">
                    <p className="text-xs font-medium text-gold">Cualquiera disponible</p>
                    <p className="text-[10px] text-cream/60">
                      Asigna automáticamente a quien tenga menos carga ese día.
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs">
                    Camila Reyes
                  </div>
                  <div className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs">
                    Andrés Ponce
                  </div>
                </div>
              </BrowserFrame>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-charcoal/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 100}
              className="text-center transition-transform duration-300 hover:scale-105"
            >
              <p className="text-2xl font-bold text-gold sm:text-3xl">
                {s.kind === "counter" ? (
                  <Counter target={s.target} suffix={s.suffix} />
                ) : (
                  s.display
                )}
              </p>
              <p className="mt-1 text-xs text-cream/60 sm:text-sm">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="scroll-mt-24 border-t border-white/10" id="proceso">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="text-center">
            <Eyebrow>Proceso operativo</Eyebrow>
            <h2 className="text-3xl font-bold">De la reserva a la gestión total</h2>
            <p className="mx-auto mt-3 max-w-2xl text-cream/70">
              De la primera reserva a la administración completa del negocio, sin curva de
              aprendizaje.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <Reveal
                key={p.title}
                delay={i * 120}
                className="group rounded-lg border border-white/10 bg-ink p-6 transition-all duration-300 hover:-translate-y-2 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink transition-transform duration-300 group-hover:scale-110">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-gold">{p.title}</h3>
                <p className="mt-2 text-sm text-cream/70">{p.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 border-t border-white/10" id="producto">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="text-center">
            <Eyebrow>Recorrido por la plataforma</Eyebrow>
            <h2 className="text-3xl font-bold">Un vistazo al panel real</h2>
            <p className="mx-auto mt-3 max-w-2xl text-cream/70">
              Vista previa del panel real de Turnify — el mismo que usas tú, con datos de ejemplo.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <Reveal delay={0}>
              <BrowserFrame>
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
                <div className="mt-3 space-y-1.5 text-[10px]">
                  <div className="flex justify-between rounded bg-ink px-2 py-1.5">
                    <span>10:00 · Marcos T.</span>
                    <span className="text-cream/50">Corte + barba</span>
                  </div>
                  <div className="flex justify-between rounded bg-ink px-2 py-1.5">
                    <span>10:30 · Julia P.</span>
                    <span className="text-cream/50">Masaje relajante</span>
                  </div>
                  <div className="flex justify-between rounded bg-ink px-2 py-1.5">
                    <span>11:00 · Rafael G.</span>
                    <span className="text-cream/50">Corte y peinado</span>
                  </div>
                </div>
              </BrowserFrame>
              <p className="mt-3 text-center text-sm text-cream/60">
                Panel del dueño — todo el negocio de un vistazo.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <BrowserFrame>
                <p className="text-sm font-semibold">Citas</p>
                <div className="mt-3 space-y-2 text-[10px]">
                  <div className="rounded-md border border-white/10 bg-ink p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Marcos T. · Corte + barba</span>
                      <StatusPill tone="green">Pagado</StatusPill>
                    </div>
                    <p className="mt-1 text-cream/50">Hoy 10:00 · Confirmada</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-ink p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Julia P. · Masaje relajante</span>
                      <StatusPill tone="yellow">Completada</StatusPill>
                    </div>
                    <p className="mt-1 flex items-center justify-between text-cream/50">
                      Hoy 10:30
                      <span className="flex gap-2 text-gold">Efectivo · Tarjeta</span>
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-ink p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Rafael G. · Corte y peinado</span>
                      <StatusPill tone="green">Pagado</StatusPill>
                    </div>
                    <p className="mt-1 text-cream/50">Hoy 11:00 · Confirmada</p>
                  </div>
                </div>
              </BrowserFrame>
              <p className="mt-3 text-center text-sm text-cream/60">
                Agenda y pagos — sin cita previa y online, juntos.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <BrowserFrame>
                <p className="text-sm font-semibold">Reseñas</p>
                <div className="mt-3 space-y-2 text-[10px]">
                  <div className="rounded-md border border-white/10 bg-ink p-2">
                    <p className="text-gold">★★★★★</p>
                    <p className="mt-1 text-cream/70">
                      &ldquo;Excelente atención, quedé muy contenta.&rdquo;
                    </p>
                    <p className="mt-1 text-cream/40">Sofía R. · Masaje relajante</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-ink p-2">
                    <p className="text-gold">★★★★★</p>
                    <p className="mt-1 text-cream/70">
                      &ldquo;Reservé en un minuto y me atendieron a tiempo.&rdquo;
                    </p>
                    <p className="mt-1 text-cream/40">Diego M. · Corte + barba</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-ink p-2">
                    <p className="text-gold">★★★★☆</p>
                    <p className="mt-1 text-cream/70">
                      &ldquo;Muy claro el recordatorio, no se me olvidó la cita.&rdquo;
                    </p>
                    <p className="mt-1 text-cream/40">Ana L. · Corte y peinado</p>
                  </div>
                </div>
              </BrowserFrame>
              <p className="mt-3 text-center text-sm text-cream/60">
                Reseñas reales de tus clientes, sin salir del panel.
              </p>
            </Reveal>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-cream/40">
            Vistas ilustrativas con datos de ejemplo para mostrar la interfaz real de Turnify.
            Pruébalo tú mismo en la{" "}
            <Link href="/book/demo-barberia" className="text-gold hover:underline">
              demo de reserva
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="scroll-mt-24 border-t border-white/10 bg-charcoal/60" id="recorrido">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="text-center">
            <Eyebrow>Cómo funciona todo</Eyebrow>
            <h2 className="text-3xl font-bold">De la primera reserva a la gestión del negocio</h2>
            <p className="mx-auto mt-3 max-w-2xl text-cream/70">
              Un recorrido paso a paso por todo el software — se reproduce solo, como un video.
              Pasa el mouse para pausarlo o haz clic en un paso para saltar directo.
            </p>
          </Reveal>

          <Reveal delay={150} className="mt-12">
            <SoftwareTour />
          </Reveal>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-cream/40">
            Vistas ilustrativas con datos de ejemplo. Pruébalo tú mismo en la{" "}
            <Link href="/book/demo-barberia" className="text-gold hover:underline">
              demo de reserva
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="scroll-mt-24 border-t border-white/10" id="categorias">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="text-center">
            <Eyebrow>Especializado por rubro</Eyebrow>
            <h2 className="text-3xl font-bold">Una plataforma, tres especialidades</h2>
            <p className="mx-auto mt-3 max-w-2xl text-cream/70">
              El mismo panel, el mismo flujo de reserva — adaptado a cómo trabaja cada rubro. Haz
              clic en una tarjeta para ver el detalle.
            </p>
          </Reveal>
          <CategoryShowcase />
        </div>
      </section>

      <section className="scroll-mt-24 border-t border-white/10" id="funcionalidades">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="text-center">
            <Eyebrow>Funcionalidades</Eyebrow>
            <h2 className="text-3xl font-bold">Todas las herramientas que tu negocio necesita</h2>
            <p className="mx-auto mt-3 max-w-2xl text-cream/70">
              Una sola plataforma para agendar, cobrar y hacer crecer tu equipo — sin depender de
              otras diez herramientas sueltas.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((b, i) => (
              <Reveal
                key={b.title}
                delay={(i % 3) * 100}
                className="group rounded-lg border border-white/10 bg-ink p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-lg font-bold text-gold transition-all duration-300 group-hover:scale-110 group-hover:bg-gold/25">
                  {b.icon}
                </span>
                <h3 className="mt-4 font-semibold text-gold">{b.title}</h3>
                <p className="mt-2 text-sm text-cream/70">{b.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16" id="precios">
        <Reveal className="text-center">
          <Eyebrow>Planes</Eyebrow>
          <h2 className="text-3xl font-bold">Precios claros, sin letra pequeña</h2>
          <p className="mx-auto mt-3 max-w-2xl text-cream/70">
            Precios de referencia por sucursal. Escríbenos por WhatsApp para confirmar el plan que
            mejor se ajusta a tu negocio.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PLANES.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 120}
              className={`relative rounded-lg border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-gold bg-gold/5 shadow-lg shadow-gold/10"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 right-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-ink">
                  Recomendado
                </span>
              )}
              <h3 className={`text-xl font-bold ${plan.highlight ? "text-gold" : ""}`}>
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-cream/70">{plan.tagline}</p>
              <p className="mt-4 text-3xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-cream/60">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-2 text-sm text-cream/80">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-gold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink(
                  `Hola, quiero más información sobre el plan ${plan.name} de Turnify.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 block rounded-md px-4 py-2 text-center font-semibold transition-all duration-300 hover:scale-[1.02] ${
                  plan.highlight
                    ? "bg-gold text-ink hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/30"
                    : "border border-gold text-gold hover:bg-gold/10"
                }`}
              >
                Escríbenos por WhatsApp
              </a>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-cream/50">
          Precios de referencia sujetos a confirmación según el tamaño de tu negocio. Sin
          comisión por cliente ni cargos ocultos.
        </p>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-charcoal/60">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 animate-blobMove rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
          <Reveal>
            <Eyebrow>Empecemos</Eyebrow>
            <h2 className="text-3xl font-bold">Da el siguiente paso con Turnify</h2>
            <p className="mx-auto mt-3 max-w-xl text-cream/70">
              Agenda una demostración guiada con nuestro equipo o escríbenos directo si tienes
              dudas sobre Turnify o sobre qué plan te conviene.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href={waLink("Hola, quiero agendar una demostración de Turnify.")}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-glowPulse rounded-md bg-gold px-6 py-3 font-semibold text-ink transition-all duration-300 hover:scale-105"
              >
                Agendar una demostración
              </a>
              <a
                href={waLink("Hola, necesito ayuda con Turnify.")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-white/20 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 hover:border-gold hover:text-gold"
              >
                Soporte
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-cream/50">
        <p>
          Turnify — hecho para barberías, salones de belleza y spas que quieren crecer sin que la
          plataforma se quede con sus ganancias.
        </p>
        <Link href="/legal" className="mt-2 inline-block text-gold hover:underline">
          Términos y privacidad
        </Link>
      </footer>

      <a
        href={waLink("Hola, quiero adquirir Turnify para mi negocio.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Adquirir Turnify por WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform duration-300 hover:scale-110"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-40" />
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M12 2C6.48 2 2 6.02 2 11c0 2.09.87 4 2.3 5.5L3 22l5.79-1.52C10.05 20.8 11 21 12 21c5.52 0 10-4.02 10-9S17.52 2 12 2zm0 16.5c-.94 0-1.85-.18-2.68-.53l-.19-.08-3.18.84.85-3.1-.12-.2A7.44 7.44 0 0 1 4.5 11 7.5 7.5 0 1 1 12 18.5z" />
        </svg>
      </a>
    </main>
  );
}
