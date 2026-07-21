import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVocabulary } from "@/lib/vocabulary";
import BookingFlow from "./BookingFlow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      staff: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  if (!business) notFound();

  const vocab = getVocabulary(business.category);

  const [ratingSummary, featuredReviews] = await Promise.all([
    prisma.review.aggregate({
      where: { businessId: business.id },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { businessId: business.id, comment: { not: null } },
      include: { client: true },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-cream">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Reservar cita</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
          {business.address && <p className="mt-1 text-cream/60">{business.address}</p>}
          <Link
            href={`/catalogo/${business.slug}`}
            className="mt-2 inline-block text-sm text-gold hover:underline"
          >
            Ver catálogo de servicios y productos →
          </Link>
          {ratingSummary._count > 0 && ratingSummary._avg.rating !== null && (
            <p className="mt-2 text-sm text-cream/70">
              <span className="text-gold">★ {ratingSummary._avg.rating.toFixed(1)}</span> ·{" "}
              {ratingSummary._count} {ratingSummary._count === 1 ? "reseña" : "reseñas"}
            </p>
          )}
        </div>

        {featuredReviews.length > 0 && (
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {featuredReviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-white/10 bg-charcoal p-4 text-sm">
                <p className="text-gold">{"★".repeat(r.rating)}</p>
                <p className="mt-1 line-clamp-3 text-cream/70">{r.comment}</p>
                <p className="mt-2 text-xs text-cream/40">{r.client.name}</p>
              </div>
            ))}
          </div>
        )}

        <BookingFlow
          businessSlug={business.slug}
          services={business.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price,
          }))}
          staff={business.staff.map((s) => ({ id: s.id, name: s.name, photoUrl: s.photoUrl }))}
          cancellationNoticeHours={business.cancellationNoticeHours}
          vocab={{
            staffSingular: vocab.staffSingular,
            bookingQuestion: vocab.bookingQuestion,
            anyStaffLabel: vocab.anyStaffLabel,
            anyStaffDescription: vocab.anyStaffDescription,
          }}
        />
      </div>
    </main>
  );
}
