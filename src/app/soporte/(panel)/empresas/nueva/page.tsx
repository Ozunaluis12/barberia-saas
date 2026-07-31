import Link from "next/link";
import { createBusinessAction } from "@/app/actions/support";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";

const CATEGORY_LABEL: Record<string, string> = {
  BARBERSHOP: "Barbería",
  HAIR_SALON: "Salón de belleza",
  SPA: "Spa",
};

const ERROR_LABEL: Record<string, string> = {
  DATOS_INVALIDOS: "Completa el nombre del negocio, el nombre y el correo del dueño.",
  EMAIL_EN_USO: "Ese correo ya tiene una cuenta en Turnify.",
};

export default async function NewBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <Link href="/soporte" className="text-sm text-gold hover:underline">
        ← Empresas
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Nueva empresa</h1>
      <p className="mt-1 text-sm text-cream/60">
        Al crearla, el dueño recibe un correo con un código para definir su propia contraseña —
        soporte nunca la escribe.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERROR_LABEL[error] ?? "No se pudo crear la empresa."}
        </p>
      )}

      <form action={createBusinessAction} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="text-sm text-cream/70">Nombre del negocio</label>
          <input
            type="text"
            name="businessName"
            required
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="text-sm text-cream/70">Categoría</label>
          <select
            name="category"
            defaultValue="BARBERSHOP"
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
          >
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-cream/70">Teléfono (opcional)</label>
            <input
              type="text"
              name="phone"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Dirección (opcional)</label>
            <input
              type="text"
              name="address"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
        </div>
        <hr className="border-white/10" />
        <div>
          <label className="text-sm text-cream/70">Nombre del dueño</label>
          <input
            type="text"
            name="ownerName"
            required
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="text-sm text-cream/70">Correo del dueño</label>
          <input
            type="email"
            name="ownerEmail"
            required
            className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
          Crear empresa
        </button>
      </form>
    </div>
  );
}
