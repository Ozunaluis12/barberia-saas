import Link from "next/link";

export const metadata = {
  title: "Términos y Privacidad — Turnify",
};

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-ink px-4 py-16 text-cream">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-gold hover:underline">
          ← Volver a Turnify
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Términos de servicio y privacidad</h1>
        <p className="mt-2 text-sm text-cream/50">Última actualización: julio de 2026.</p>

        <div className="mt-8 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-cream/80">
          Este documento es una plantilla inicial pensada para dejar por escrito, en términos
          claros, cómo funciona Turnify y cómo se manejan los datos. No sustituye asesoría legal
          profesional — antes de depender de él frente a un cliente o una autoridad, conviene que
          un abogado lo revise y lo ajuste a tu país y forma de operar.
        </div>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">1. Qué es Turnify</h2>
          <p>
            Turnify es una plataforma para que negocios de servicios (barberías, salones, spas,
            consultorios y similares) administren su agenda: reservas en línea, personal,
            servicios, clientes y reportes. Quien crea una cuenta ("el negocio") es responsable de
            la información que carga y de cómo la usa frente a sus propios clientes.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">2. Qué datos se recopilan</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Datos de la cuenta del negocio: nombre, correo, contraseña (guardada como hash,
              nunca en texto plano).</li>
            <li>Datos que el negocio carga sobre su operación: personal, servicios, precios.</li>
            <li>Datos de los clientes del negocio que reservan citas: nombre y teléfono, historial
              de citas, reseñas que dejen.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">3. Para qué se usan los datos</h2>
          <p>
            Únicamente para operar el servicio: mostrar la disponibilidad de citas, enviar el
            enlace de recuperación de contraseña, y (cuando el negocio los active) recordatorios de
            citas. No se venden datos a terceros ni se usan para publicidad.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">4. Con quién se comparten</h2>
          <p>Los datos se almacenan y procesan a través de proveedores externos necesarios para
            operar el servicio:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Render</strong> — hospeda la aplicación y la base de datos.</li>
            <li><strong>Resend</strong> — envía los correos transaccionales (recuperar
              contraseña, recordatorios).</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">5. Derechos de los clientes y negocios</h2>
          <p>
            Cualquier persona puede solicitar que se elimine o corrija su información escribiendo
            al correo de contacto abajo. Un negocio que cierra su cuenta puede pedir que se borren
            todos sus datos y los de sus clientes.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">6. Seguridad</h2>
          <p>
            Las contraseñas se guardan como hash (nunca en texto plano), las sesiones usan cookies
            firmadas y la conexión a la base de datos va cifrada. Ningún sistema es 100% infalible;
            si detectamos un incidente de seguridad que afecte tus datos, te avisaremos.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">7. Cambios y disponibilidad</h2>
          <p>
            El servicio puede cambiar, mejorar o eventualmente descontinuarse. Los cambios
            importantes a estos términos se avisarán a los dueños de negocio registrados.
          </p>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-relaxed text-cream/80">
          <h2 className="text-xl font-semibold text-cream">8. Contacto</h2>
          <p>
            Para dudas sobre privacidad, solicitar eliminación de datos, o cualquier otro tema
            legal relacionado con Turnify, escribe a{" "}
            <a href="mailto:ozunaluis872@gmail.com" className="text-gold hover:underline">
              ozunaluis872@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
