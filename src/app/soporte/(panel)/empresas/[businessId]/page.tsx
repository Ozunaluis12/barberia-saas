import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BUSINESS_CATEGORIES } from "@/lib/vocabulary";
import {
  setBusinessStatusAction,
  updateSubscriptionAction,
  toggleStaffActiveAction,
  updateBusinessInfoAction,
  updateBusinessLogoAction,
  addStaffAction,
  updateStaffRoleAction,
  deleteStaffAction,
  recordSubscriptionPaymentAction,
  deleteBusinessAction,
  toggleStoreEnabledAction,
  toggleGiftCardsEnabledAction,
} from "@/app/actions/support";

const ACTION_LABEL: Record<string, string> = {
  SUPPORT_SUSPEND_BUSINESS: "Soporte suspendió la empresa",
  SUPPORT_ACTIVATE_BUSINESS: "Soporte reactivó la empresa",
  SUPPORT_UPDATE_SUBSCRIPTION: "Soporte actualizó la suscripción",
  SUPPORT_ACTIVATE_STAFF: "Soporte reactivó una cuenta de personal",
  SUPPORT_DEACTIVATE_STAFF: "Soporte desactivó una cuenta de personal",
  SUPPORT_CREATE_BUSINESS: "Soporte creó la empresa",
  SUPPORT_ADD_STAFF: "Soporte agregó una cuenta de personal",
  SUPPORT_CHANGE_ROLE: "Soporte cambió un rol",
  SUPPORT_DELETE_STAFF: "Soporte eliminó una cuenta de personal",
  SUPPORT_DELETE_STAFF_BLOCKED: "Soporte intentó eliminar una cuenta con historial",
  SUPPORT_UPDATE_LOGO: "Soporte actualizó el logo",
  SUPPORT_UPDATE_BUSINESS_INFO: "Soporte actualizó los datos del negocio",
  SUPPORT_RECORD_PAYMENT: "Soporte registró un pago de suscripción",
  SUPPORT_DELETE_BUSINESS: "Soporte eliminó la empresa",
  SUPPORT_ENABLE_STORE: "Soporte activó la Tiendita",
  SUPPORT_DISABLE_STORE: "Soporte desactivó la Tiendita",
  SUPPORT_ENABLE_GIFTCARDS: "Soporte activó las tarjetas de regalo",
  SUPPORT_DISABLE_GIFTCARDS: "Soporte desactivó las tarjetas de regalo",
};

const CATEGORY_LABEL: Record<string, string> = {
  BARBERSHOP: "Barbería",
  HAIR_SALON: "Salón de belleza",
  SPA: "Spa",
};

const ERROR_LABEL: Record<string, string> = {
  DATOS_INVALIDOS: "Completa los campos requeridos.",
  EMAIL_EN_USO: "Ese correo ya tiene una cuenta en Turnify.",
  ULTIMO_DUENO: "No puedes quitarle el rol de dueño a la única cuenta OWNER activa.",
  TIENE_HISTORIAL: "Esa cuenta tiene historial de caja, ventas o nómina — no se puede eliminar. Usa \"Desactivar\" en su lugar.",
  ULTIMA_CUENTA: "No puedes eliminar la única cuenta con acceso a esta empresa.",
  LOGO_REQUERIDO: "Selecciona una imagen para el logo.",
  ERROR_SUBIENDO_LOGO: "No se pudo subir el logo. Intenta de nuevo.",
  CONFIRMACION_INVALIDA: "El texto no coincide con el identificador de la empresa — no se eliminó nada.",
};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function SupportBusinessDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { businessId } = await params;
  const { error } = await searchParams;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { organization: true, users: { orderBy: { name: "asc" } } },
  });
  if (!business) notFound();

  const [logs, invoices] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId: business.organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.subscriptionInvoice.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-cream/50">{business.organization.name}</p>
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <p className="text-sm text-cream/40">/{business.slug}</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {ERROR_LABEL[error] ?? "Ocurrió un error."}
        </p>
      )}

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Estado de la cuenta</h2>
        <p className="mt-1 text-sm text-cream/60">
          Estado actual:{" "}
          <span className={business.subscriptionStatus === "SUSPENDED" ? "text-red-400" : "text-green-400"}>
            {business.subscriptionStatus === "SUSPENDED" ? "Suspendida" : "Activa"}
          </span>
          {business.subscriptionStatus === "SUSPENDED" && business.suspendedReason && (
            <> — {business.suspendedReason}</>
          )}
        </p>

        {business.subscriptionStatus === "SUSPENDED" ? (
          <form action={setBusinessStatusAction} className="mt-4">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="status" value="ACTIVE" />
            <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
              Reactivar empresa
            </button>
          </form>
        ) : (
          <form action={setBusinessStatusAction} className="mt-4 space-y-2">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="status" value="SUSPENDED" />
            <label className="text-sm text-cream/70">Motivo (opcional)</label>
            <textarea
              name="reason"
              rows={2}
              className="w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
              placeholder="Ej: pago de suscripción vencido"
            />
            <button type="submit" className="rounded-md bg-red-500/20 px-4 py-2 font-semibold text-red-300 hover:bg-red-500/30">
              Suspender empresa
            </button>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Datos generales</h2>
        <form action={updateBusinessInfoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="businessId" value={business.id} />
          <div>
            <label className="text-sm text-cream/70">Nombre</label>
            <input
              type="text"
              name="name"
              defaultValue={business.name}
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Categoría</label>
            <select
              name="category"
              defaultValue={business.category}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            >
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c] ?? c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-cream/70">Teléfono</label>
            <input
              type="text"
              name="phone"
              defaultValue={business.phone ?? ""}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-sm text-cream/70">Dirección</label>
            <input
              type="text"
              name="address"
              defaultValue={business.address ?? ""}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
              Guardar datos
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-cream/40">
          El identificador /{business.slug} no se puede cambiar aquí — ya está en uso en links de
          reserva y QRs del negocio.
        </p>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Funciones</h2>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Tiendita (mecatos, bebidas, snacks)</p>
            <p className="text-xs text-cream/50">
              No todos los negocios venden esto — actívalo solo si lo piden.
            </p>
          </div>
          <form action={toggleStoreEnabledAction}>
            <input type="hidden" name="businessId" value={business.id} />
            <button
              type="submit"
              className={
                business.storeEnabled
                  ? "rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                  : "rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold/90"
              }
            >
              {business.storeEnabled ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>

        <hr className="my-4 border-white/10" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Tarjetas de regalo</p>
            <p className="text-xs text-cream/50">
              En persona y compra online — actívalo solo si el negocio las quiere vender.
            </p>
          </div>
          <form action={toggleGiftCardsEnabledAction}>
            <input type="hidden" name="businessId" value={business.id} />
            <button
              type="submit"
              className={
                business.giftCardsEnabled
                  ? "rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                  : "rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold/90"
              }
            >
              {business.giftCardsEnabled ? "Desactivar" : "Activar"}
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Logo</h2>
        <p className="mt-1 text-sm text-cream/60">
          Aparece en las facturas PDF que este negocio emite a sus propios clientes, en vez del
          nombre solo.
        </p>
        <div className="mt-4 flex items-center gap-4">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.name} className="h-16 w-16 rounded object-contain bg-white/5" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded bg-white/5 text-xs text-cream/40">
              Sin logo
            </div>
          )}
          <form action={updateBusinessLogoAction} className="flex items-center gap-3">
            <input type="hidden" name="businessId" value={business.id} />
            <input type="file" name="logo" accept="image/*" required className="text-sm text-cream/70" />
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90">
              Subir logo
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Suscripción</h2>
        <form action={updateSubscriptionAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="businessId" value={business.id} />
          <div>
            <label className="text-sm text-cream/70">Plan</label>
            <select
              name="plan"
              defaultValue={business.plan}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="GRATIS">GRATIS</option>
              <option value="PRO">PRO</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-cream/70">Próxima renovación</label>
            <input
              type="date"
              name="subscriptionRenewsAt"
              defaultValue={toDateInputValue(business.subscriptionRenewsAt)}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-cream/70">Notas (método de pago, acuerdos, etc.)</label>
            <textarea
              name="subscriptionNotes"
              rows={3}
              defaultValue={business.subscriptionNotes ?? ""}
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-md bg-gold px-4 py-2 font-semibold text-ink hover:bg-gold/90">
              Guardar
            </button>
          </div>
        </form>

        <hr className="my-5 border-white/10" />

        <h3 className="text-sm font-semibold text-cream/80">Registrar pago</h3>
        <form action={recordSubscriptionPaymentAction} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="businessId" value={business.id} />
          <div>
            <label className="text-xs text-cream/60">Monto</label>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Desde</label>
            <input
              type="date"
              name="periodStart"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Hasta</label>
            <input
              type="date"
              name="periodEnd"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Notas</label>
            <input
              type="text"
              name="notes"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div className="sm:col-span-4">
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90">
              Registrar pago
            </button>
          </div>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream/60">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Monto</th>
                <th className="px-2 py-2">Período</th>
                <th className="px-2 py-2">Registrado por</th>
                <th className="px-2 py-2">Notas</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-white/5">
                  <td className="px-2 py-2 text-cream/70">{inv.paidAt.toLocaleDateString("es")}</td>
                  <td className="px-2 py-2">{inv.amount.toLocaleString("es")}</td>
                  <td className="px-2 py-2 text-cream/70">
                    {inv.periodStart.toLocaleDateString("es")} – {inv.periodEnd.toLocaleDateString("es")}
                  </td>
                  <td className="px-2 py-2 text-cream/70">{inv.recordedByName}</td>
                  <td className="px-2 py-2 text-cream/50">{inv.notes ?? "—"}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td className="px-2 py-6 text-center text-cream/40" colSpan={5}>
                    Todavía no hay pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Personal con acceso</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream/60">
              <tr>
                <th className="px-2 py-2">Nombre</th>
                <th className="px-2 py-2">Correo</th>
                <th className="px-2 py-2">Rol</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {business.users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-2 py-2">{u.name}</td>
                  <td className="px-2 py-2 text-cream/70">{u.email}</td>
                  <td className="px-2 py-2">
                    <form action={updateStaffRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="businessId" value={business.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-md border border-white/20 bg-ink px-2 py-1 text-xs outline-none focus:border-gold"
                      >
                        <option value="OWNER">OWNER</option>
                        <option value="STAFF">STAFF</option>
                      </select>
                      <button type="submit" className="text-xs text-gold hover:underline">
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-2 py-2">
                    <span className={u.active ? "text-green-400" : "text-red-400"}>
                      {u.active ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <form action={toggleStaffActiveAction} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="businessId" value={business.id} />
                      <button type="submit" className="text-gold hover:underline">
                        {u.active ? "Desactivar" : "Reactivar"}
                      </button>
                    </form>
                    <span className="mx-2 text-cream/20">|</span>
                    <form action={deleteStaffAction} className="inline">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="businessId" value={business.id} />
                      <button type="submit" className="text-red-400 hover:underline">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="my-5 border-white/10" />

        <h3 className="text-sm font-semibold text-cream/80">Agregar cuenta</h3>
        <p className="mt-1 text-xs text-cream/50">
          Útil si el negocio está en sociedad y necesita más de un dueño con acceso.
        </p>
        <form action={addStaffAction} className="mt-3 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="businessId" value={business.id} />
          <div>
            <label className="text-xs text-cream/60">Nombre</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Correo</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-cream/60">Rol</label>
            <select
              name="role"
              defaultValue="STAFF"
              className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
            >
              <option value="OWNER">OWNER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold/90">
              Agregar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="font-semibold">Auditoría de la organización</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-cream/60">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Quién</th>
                <th className="px-2 py-2">Acción</th>
                <th className="px-2 py-2">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-white/5">
                  <td className="px-2 py-2 text-cream/70">
                    {l.createdAt.toLocaleString("es", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-2 py-2 font-medium">{l.userName}</td>
                  <td className="px-2 py-2 text-cream/70">{ACTION_LABEL[l.action] ?? l.action}</td>
                  <td className="px-2 py-2 text-cream/50">{l.details ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="px-2 py-6 text-center text-cream/40" colSpan={4}>
                    Todavía no hay entradas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <h2 className="font-semibold text-red-300">Zona de peligro</h2>
        <p className="mt-1 text-sm text-cream/60">
          Elimina la empresa por completo: sucursal, personal, citas, historial de caja y ventas.
          No se puede deshacer. Para confirmar, escribe exactamente <code>{business.slug}</code>.
        </p>
        <form action={deleteBusinessAction} className="mt-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="businessId" value={business.id} />
          <input
            type="text"
            name="confirmSlug"
            placeholder={business.slug}
            required
            className="rounded-md border border-red-500/30 bg-ink px-3 py-2 text-sm outline-none focus:border-red-400"
          />
          <button type="submit" className="rounded-md bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30">
            Eliminar empresa definitivamente
          </button>
        </form>
      </section>
    </div>
  );
}
