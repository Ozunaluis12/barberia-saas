import Link from "next/link";
import CategoryShowcase from "./CategoryShowcase";

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
      "Barbero, estilista, doctor/a, veterinario/a, entrenador/a, técnico... el panel y la reserva usan el término correcto para tu tipo de negocio.",
  },
  {
    icon: "⚑",
    title: "Historial de sanciones por cliente",
    detail:
      "Si un cliente cancela tarde o no se presenta, queda registrado automáticamente y visible para todo el equipo antes de confirmarle otra cita.",
  },
];

const STATS = [
  { value: "0%", label: "de comisión por venta" },
  { value: "24/7", label: "reservas en línea" },
  { value: "8+", label: "tipos de negocio" },
  { value: "1", label: "panel para todo tu equipo" },
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

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-charcoal p-4 shadow-2xl shadow-black/40">
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
    <main className="min-h-screen bg-ink text-cream">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-gold">Turnify</span>
          <nav className="flex items-center gap-4 text-sm">
            <a
              href={waLink("Hola, necesito ayuda con Turnify.")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold"
            >
              Soporte
            </a>
            <Link href="/book/demo-barberia" className="hover:text-gold">
              Ver demo
            </Link>
            <Link href="/login" className="hover:text-gold">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
            >
              Crear mi negocio
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <p className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
            Agenda de citas para negocios de servicios
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl">
            El software de citas para tu negocio,{" "}
            <span className="text-gold">sin comisiones que te roben tus ganancias</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-cream/80">
            Tus clientes eligen con quién quieren su cita — o dejan que Turnify asigne al
            especialista disponible más justo ese día. Tú administras personal, servicios,
            citas sin previa cita, pagos y reseñas desde un solo panel.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold/90"
            >
              Crear mi negocio gratis
            </Link>
            <Link
              href="/book/demo-barberia"
              className="rounded-md border border-white/20 px-6 py-3 font-semibold hover:border-gold hover:text-gold"
            >
              Probar reserva de cliente
            </Link>
          </div>
          <p className="mt-4 text-sm text-cream/50">
            Sin tarjeta de crédito. Tu negocio queda listo para recibir reservas en minutos.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <BrowserFrame>
            <ol className="mb-4 flex gap-1.5 text-[10px] text-cream/50">
              {["Servicio", "Especialista", "Horario", "Tus datos"].map((label, i) => (
                <li
                  key={label}
                  className={`rounded-full px-2 py-1 ${
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
      </section>

      <section className="border-y border-white/10 bg-charcoal/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-gold sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-cream/60 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Cómo funciona</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
            De la primera reserva a llevar el negocio completo, sin curva de aprendizaje.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <div key={p.title} className="rounded-lg border border-white/10 bg-ink p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-gold">{p.title}</h3>
                <p className="mt-2 text-sm text-cream/70">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Así se ve por dentro</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
            Vista previa del panel real de Turnify — el mismo que usas tú, con datos de ejemplo.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div>
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
                    <span className="text-cream/50">Consulta general</span>
                  </div>
                </div>
              </BrowserFrame>
              <p className="mt-3 text-center text-sm text-cream/60">
                Panel del dueño — todo el negocio de un vistazo.
              </p>
            </div>

            <div>
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
                      <span className="font-medium">Rafael G. · Consulta general</span>
                      <StatusPill tone="green">Pagado</StatusPill>
                    </div>
                    <p className="mt-1 text-cream/50">Hoy 11:00 · Confirmada</p>
                  </div>
                </div>
              </BrowserFrame>
              <p className="mt-3 text-center text-sm text-cream/60">
                Agenda y pagos — sin cita previa y online, juntos.
              </p>
            </div>

            <div>
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
                    <p className="mt-1 text-cream/40">Ana L. · Consulta general</p>
                  </div>
                </div>
              </BrowserFrame>
              <p className="mt-3 text-center text-sm text-cream/60">
                Reseñas reales de tus clientes, sin salir del panel.
              </p>
            </div>
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

      <section className="border-t border-white/10 bg-charcoal/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">
            Un software para diferentes tipos de negocio
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
            El mismo panel, el mismo flujo de reserva — adaptado a cómo trabaja cada rubro. Haz
            clic en una tarjeta para ver el detalle.
          </p>
          <CategoryShowcase />
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Todo lo que tu negocio necesita</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
            Una sola plataforma para agendar, cobrar y hacer crecer tu equipo — sin depender de
            otras diez herramientas sueltas.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div
                key={b.title}
                className="rounded-lg border border-white/10 bg-ink p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-lg font-bold text-gold">
                  {b.icon}
                </span>
                <h3 className="mt-4 font-semibold text-gold">{b.title}</h3>
                <p className="mt-2 text-sm text-cream/70">{b.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16" id="precios">
        <h2 className="text-center text-3xl font-bold">Precio simple, sin letra chica</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-gold bg-gold/5 p-8">
            <h3 className="text-xl font-bold text-gold">Gratis</h3>
            <p className="mt-1 text-cream/70">Todo lo que necesitas para empezar, hoy mismo</p>
            <p className="mt-4 text-3xl font-bold">$0</p>
            <ul className="mt-6 space-y-2 text-sm text-cream/80">
              <li>Equipo y reservas online ilimitadas</li>
              <li>Citas sin cita previa (walk-in) y online juntas</li>
              <li>Reseñas, reportes de desempeño y comisiones</li>
              <li>Historial de clientes con sanciones por cancelación tardía</li>
            </ul>
            <Link
              href="/signup"
              className="mt-6 block rounded-md bg-gold px-4 py-2 text-center font-semibold text-ink hover:bg-gold/90"
            >
              Crear mi negocio gratis
            </Link>
          </div>
          <div className="rounded-lg border border-white/10 p-8">
            <h3 className="text-xl font-bold">Pro</h3>
            <p className="mt-1 text-cream/70">En construcción — todavía no disponible</p>
            <p className="mt-4 text-3xl font-bold">
              $19.99<span className="text-base font-normal text-cream/60">/mes por sucursal</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cream/80">
              <li>Multi-sucursal (próximamente)</li>
              <li>Recordatorios automáticos por WhatsApp/SMS (próximamente)</li>
              <li>Cobro con tarjeta en línea (próximamente)</li>
            </ul>
            <a
              href={waLink("Hola, quiero más información sobre el plan Pro de Turnify.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block rounded-md border border-gold px-4 py-2 text-center font-semibold text-gold hover:bg-gold/10"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-cream/50">
          Sin comisión por cliente nuevo. Sin cargos ocultos. Nunca. Mientras el plan Pro está en
          desarrollo, todo el producto es gratis para cualquier tamaño de equipo.
        </p>
      </section>

      <section className="border-t border-white/10 bg-charcoal/60">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">¿Quieres verlo funcionar en tu negocio?</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/70">
            Agenda una demostración guiada con nuestro equipo o escríbenos directo si tienes
            dudas sobre Turnify o sobre qué plan te conviene.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={waLink("Hola, quiero agendar una demostración de Turnify.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold/90"
            >
              Agendar una demostración
            </a>
            <a
              href={waLink("Hola, necesito ayuda con Turnify.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-white/20 px-6 py-3 font-semibold hover:border-gold hover:text-gold"
            >
              Soporte por WhatsApp
            </a>
          </div>
          <p className="mt-4 text-sm text-cream/50">WhatsApp: +57 300 417 7979</p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-cream/50">
        <p>
          Turnify — hecho para negocios de servicios que quieren crecer sin que la plataforma se
          quede con sus ganancias.
        </p>
        <Link href="/legal" className="mt-2 inline-block text-gold hover:underline">
          Términos y privacidad
        </Link>
      </footer>
    </main>
  );
}
