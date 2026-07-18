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

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-cream">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Reservar cita</p>
          <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
          {business.address && <p className="mt-1 text-cream/60">{business.address}</p>}
        </div>
        <BookingFlow
          businessSlug={business.slug}
          services={business.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price,
          }))}
          staff={business.staff.map((s) => ({ id: s.id, name: s.name }))}
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
