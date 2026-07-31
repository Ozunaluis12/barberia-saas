import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { createExpense, deleteExpense } from "@/app/actions/expenses";
import { formatCOP } from "@/lib/money";

const ERRORS: Record<string, string> = {
  CATEGORIA_REQUERIDA: "La categoría es obligatoria.",
  MONTO_INVALIDO: "El monto debe ser mayor a 0.",
  FECHA_INVALIDA: "Elige una fecha válida.",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requirePermission("reports");
  const { error } = await searchParams;

  const expenses = await prisma.expense.findMany({
    where: { businessId: session.businessId },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Gastos</h1>
      <p className="mt-1 text-sm text-cream/60">
        Gastos operativos del negocio (arriendo, insumos, servicios) — se descuentan del ingreso
        en Reportes y Analítica para mostrar la ganancia real.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERRORS[error] ?? "Ocurrió un error, intenta de nuevo."}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-cream/60">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2">Monto</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-cream/70">
                    {e.date.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2 font-medium">{e.category}</td>
                  <td className="px-4 py-2 text-cream/60">{e.description ?? "—"}</td>
                  <td className="px-4 py-2 text-cream/70">{formatCOP(e.amount)}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteExpense.bind(null, e.id)}>
                      <button className="text-xs text-red-400 hover:underline">Eliminar</button>
                    </form>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-cream/40" colSpan={5}>
                    Aún no has registrado gastos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 max-w-lg rounded-lg border border-white/10 bg-charcoal p-6">
        <h2 className="text-lg font-semibold">Registrar gasto</h2>
        <form action={createExpense} className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-cream/70">Categoría</label>
            <input
              name="category"
              required
              placeholder="Arriendo, insumos, servicios..."
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cream/70">Monto</label>
              <input
                type="number"
                name="amount"
                step="1"
                min={0}
                required
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="text-sm text-cream/70">Fecha</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-cream/70">Descripción (opcional)</label>
            <input
              name="description"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Guardar gasto
          </button>
        </form>
      </div>
    </div>
  );
}
