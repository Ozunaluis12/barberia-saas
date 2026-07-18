import Link from "next/link";

const NEGOCIOS = [
  "Barberías",
  "Salones de belleza",
  "Spas",
  "Consultorios médicos",
  "Veterinarias",
  "Talleres",
  "Gimnasios",
  "Y cualquier negocio con citas",
];

const DIFERENCIADORES = [
  {
    title: "Cero comisiones ocultas",
    detail:
      "Precio plano por negocio. Nunca te cobramos un porcentaje por un cliente que ya era tuyo (a diferencia de Fresha o StyleSeat, que cobran hasta 20-25% incluso por clientes de boca a boca).",
  },
  {
    title: "El cliente elige a su especialista",
    detail:
      "O deja que el sistema asigne automáticamente a quien esté disponible con menos carga de trabajo ese día, para repartir las citas de forma justa entre todo el equipo.",
  },
  {
    title: "Citas sin cita previa y online en el mismo calendario",
    detail:
      "A diferencia de StyleSeat y Vagaro, que no manejan bien la fila de clientes sin cita, en Turnify una visita sin cita y una reserva online conviven en el mismo horario sin choques.",
  },
  {
    title: "Reseñas, reportes y pagos en un solo lugar",
    detail:
      "Tus clientes dejan reseña después de cada cita, tú ves el desempeño de tu equipo y llevas el control de qué se pagó y cómo — sin depender de hojas de cálculo aparte.",
  },
  {
    title: "Se adapta al vocabulario de tu rubro",
    detail:
      "Barbero, estilista, doctor/a, veterinario/a, entrenador/a, técnico... el panel y la reserva usan el término correcto para tu tipo de negocio.",
  },
  {
    title: "Historial de sanciones por cliente",
    detail:
      "Si un cliente cancela tarde o no se presenta, queda registrado automáticamente y visible para todo el equipo antes de confirmarle otra cita — algo que ninguna de esas plataformas resuelve.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-gold">Turnify</span>
          <nav className="flex items-center gap-4 text-sm">
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

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Agenda de citas para cualquier negocio con{" "}
          <span className="text-gold">equipo de trabajo</span>, sin comisiones que te
          roben tus ganancias
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-cream/80">
          Tus clientes eligen con quién quieren su cita — o dejan que Turnify asigne al
          especialista disponible más justo ese día. Tú administras personal, servicios,
          citas sin previa cita y comisiones desde un solo panel.
        </p>
        <div className="mt-8 flex justify-center gap-4">
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
      </section>

      <section className="border-t border-white/10 bg-charcoal/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">Para qué tipo de negocios sirve</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
            El mismo panel, el mismo flujo de reserva — sin desarrollar una versión distinta
            para cada rubro.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {NEGOCIOS.map((n) => (
              <div
                key={n}
                className="rounded-lg border border-white/10 bg-ink px-4 py-5 text-center text-sm font-medium text-cream/80"
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">
            Lo que la competencia hace mal — y nosotros resolvemos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream/70">
            Analizamos Booksy, Fresha, StyleSeat, Vagaro y Square Appointments. Este es
            el resultado.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIFERENCIADORES.map((d) => (
              <div
                key={d.title}
                className="rounded-lg border border-white/10 bg-charcoal p-6"
              >
                <h3 className="font-semibold text-gold">{d.title}</h3>
                <p className="mt-2 text-sm text-cream/70">{d.detail}</p>
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
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-cream/50">
          Sin comisión por cliente nuevo. Sin cargos ocultos. Nunca. Mientras el plan Pro está en
          desarrollo, todo el producto es gratis para cualquier tamaño de equipo.
        </p>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-cream/50">
        Turnify — hecho para negocios de servicios que quieren crecer sin que la
        plataforma se quede con sus ganancias.
      </footer>
    </main>
  );
}
