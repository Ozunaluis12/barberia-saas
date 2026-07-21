import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";
import Avatar from "@/components/Avatar";

export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      products: { where: { active: true }, orderBy: { name: "asc" } },
      staff: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  if (!business) notFound();

  const vocab = getVocabulary(business.category);

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-cream">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Catálogo</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
          {business.address && <p className="mt-1 text-cream/60">{business.address}</p>}
          <Link
            href={`/book/${business.slug}`}
            className="mt-4 inline-block rounded-md bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Reservar cita
          </Link>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gold">Servicios</h2>
          {business.services.length === 0 && (
            <p className="mt-2 text-sm text-cream/50">Aún no hay servicios publicados.</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {business.services.map((s) => (
              <div
                key={s.id}
                className="flex gap-4 rounded-lg border border-white/10 bg-charcoal p-4"
              >
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageUrl}
                    alt={s.name}
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs text-cream/40">
                    Sin foto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{s.name}</p>
                    <p className="shrink-0 font-semibold text-gold">${s.price.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-cream/50">{s.durationMinutes} min</p>
                  {s.description && (
                    <p className="mt-1 text-sm text-cream/70">{s.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gold">Productos</h2>
          {business.products.length === 0 && (
            <p className="mt-2 text-sm text-cream/50">Aún no hay productos publicados.</p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {business.products.map((p) => (
              <div
                key={p.id}
                className="flex gap-4 rounded-lg border border-white/10 bg-charcoal p-4"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs text-cream/40">
                    Sin foto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{p.name}</p>
                    <p className="shrink-0 font-semibold text-gold">${p.price.toFixed(2)}</p>
                  </div>
                  {p.description && (
                    <p className="mt-1 text-sm text-cream/70">{p.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {business.staff.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gold">{vocab.staffPlural}</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              {business.staff.map((s) => (
                <div key={s.id} className="flex flex-col items-center gap-2 text-center">
                  <Avatar src={s.photoUrl} name={s.name} size={56} />
                  <p className="text-sm text-cream/70">{s.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 text-center">
          <Link
            href={`/book/${business.slug}`}
            className="inline-block rounded-md bg-gold px-5 py-2 font-semibold text-ink hover:bg-gold/90"
          >
            Reservar cita
          </Link>
        </div>
      </div>
    </main>
  );
}
