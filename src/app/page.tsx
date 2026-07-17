import Link from "next/link";

const DIFERENCIADORES = [
  {
    title: "Cero comisiones ocultas",
    detail:
      "Precio plano por barbería. Nunca te cobramos un porcentaje por un cliente que ya era tuyo (a diferencia de Fresha o StyleSeat, que cobran hasta 20-25% incluso por clientes de boca a boca).",
  },
  {
    title: "El cliente elige a su barbero",
    detail:
      "O deja que el sistema asigne automáticamente al barbero disponible con menos carga de trabajo ese día, para repartir las citas de forma justa entre todo el equipo.",
  },
  {
    title: "Walk-ins y citas online en el mismo calendario",
    detail:
      "A diferencia de StyleSeat y Vagaro, que no manejan bien la fila de clientes sin cita, en CorteYa un walk-in y una reserva online conviven en el mismo horario sin choques.",
  },
  {
    title: "Comisiones de cada barbero, transparentes",
    detail:
      "Cada barbero tiene su % de comisión configurado. El panel calcula automáticamente cuánto le corresponde a cada quien, sin depender de una hoja de cálculo aparte.",
  },
  {
    title: "Pensado para crecer a varias sucursales",
    detail:
      "Multi-sucursal desde el día uno, no como un parche pagado aparte.",
  },
  {
    title: "Reportes y soporte incluidos",
    detail: "Sin cobros extra por ver tus propios reportes o por hablar con soporte.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-xl font-bold tracking-tight text-gold">CorteYa</span>
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
              Crear mi barbería
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Agenda de citas para barberías con{" "}
          <span className="text-gold">varios barberos</span>, sin comisiones que te
          roben tus ganancias
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-cream/80">
          Tus clientes eligen con quién cortarse el cabello — o dejan que CorteYa
          asigne al barbero disponible más justo ese día. Tú administras barberos,
          servicios, walk-ins y comisiones desde un solo panel.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-gold px-6 py-3 font-semibold text-ink hover:bg-gold/90"
          >
            Crear mi barbería gratis
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
                className="rounded-lg border border-white/10 bg-ink p-6"
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
          <div className="rounded-lg border border-white/10 p-8">
            <h3 className="text-xl font-bold">Gratis</h3>
            <p className="mt-1 text-cream/70">Para una barbería empezando</p>
            <p className="mt-4 text-3xl font-bold">$0</p>
            <ul className="mt-6 space-y-2 text-sm text-cream/80">
              <li>Hasta 2 barberos</li>
              <li>Reservas online ilimitadas</li>
              <li>Panel de comisiones</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gold bg-gold/5 p-8">
            <h3 className="text-xl font-bold text-gold">Pro</h3>
            <p className="mt-1 text-cream/70">Para equipos y varias sucursales</p>
            <p className="mt-4 text-3xl font-bold">
              $19.99<span className="text-base font-normal text-cream/60">/mes por sucursal</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cream/80">
              <li>Barberos ilimitados</li>
              <li>Multi-sucursal</li>
              <li>Recordatorios automáticos</li>
              <li>Soporte y reportes incluidos</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-cream/50">
          Sin comisión por cliente nuevo. Sin cargos ocultos. Nunca.
        </p>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-cream/50">
        CorteYa — hecho para barberías que quieren crecer sin que la plataforma se
        quede con sus ganancias.
      </footer>
    </main>
  );
}
