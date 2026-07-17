import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BookingFlow from "./BookingFlow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      barbers: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  if (!shop) notFound();

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-cream">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Reservar cita</p>
          <h1 className="mt-1 text-3xl font-bold">{shop.name}</h1>
          {shop.address && <p className="mt-1 text-cream/60">{shop.address}</p>}
        </div>
        <BookingFlow
          shopSlug={shop.slug}
          services={shop.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price,
          }))}
          barbers={shop.barbers.map((b) => ({ id: b.id, name: b.name }))}
          cancellationNoticeHours={shop.cancellationNoticeHours}
        />
      </div>
    </main>
  );
}
