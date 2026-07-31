import Link from "next/link";
import DemoTour from "../DemoTour";

const WHATSAPP_NUMBER = "573004177979";
function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const metadata = {
  title: "Demo — Turnify",
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight text-gold">
            Turnify
          </Link>
          <Link href="/" className="text-sm text-cream/70 transition-colors hover:text-gold">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 text-center">
        <p className="mx-auto mb-3 w-fit rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
          Demo
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">Cómo funciona Turnify</h1>
        <p className="mx-auto mt-3 max-w-xl text-cream/70">
          Elige tu rubro para ver un recorrido paso a paso, adaptado a cómo trabaja tu negocio.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <DemoTour />
      </section>

      <section className="border-t border-white/10 bg-charcoal/60">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold">¿Listo para llevarlo a tu negocio?</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/70">
            Escríbenos y coordinamos el plan que mejor se ajuste a tu negocio.
          </p>
          <a
            href={waLink("Hola, quiero solicitar acceso a Turnify para mi negocio.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-md bg-gold px-6 py-3 font-semibold text-ink transition-all duration-300 hover:scale-105 hover:bg-gold/90"
          >
            Solicitar acceso
          </a>
        </div>
      </section>
    </main>
  );
}
