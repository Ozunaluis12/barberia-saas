import { getBusinessReviews } from "@/app/actions/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} de 5 estrellas`}>
      {"★".repeat(rating)}
      <span className="text-white/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function ReviewsPage() {
  const reviews = await getBusinessReviews();
  const average =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reseñas</h1>
        {average !== null && (
          <p className="text-sm text-cream/70">
            Promedio: <span className="font-semibold text-gold">{average.toFixed(1)}</span> / 5 ·{" "}
            {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-white/10 bg-charcoal p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{r.client.name}</p>
                {r.staff && <p className="text-xs text-cream/50">Atendido por {r.staff.name}</p>}
              </div>
              <Stars rating={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm text-cream/80">{r.comment}</p>}
            <p className="mt-2 text-xs text-cream/40">
              {r.createdAt.toLocaleDateString("es", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="rounded-lg border border-white/10 bg-charcoal p-6 text-center text-sm text-cream/40">
            Aún no tienes reseñas. Aparecen aquí cuando un cliente reseña una cita completada.
          </p>
        )}
      </div>
    </div>
  );
}
