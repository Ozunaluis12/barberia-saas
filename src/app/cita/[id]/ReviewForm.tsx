"use client";

import { useState } from "react";
import { submitReview } from "@/app/actions/reviews";

export default function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: true } | { ok: false; error: string } | null>(null);

  if (result?.ok) {
    return (
      <div className="rounded-md border border-white/10 bg-ink p-4 text-center text-sm text-cream/70">
        ¡Gracias por tu reseña!
      </div>
    );
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    const res = await submitReview(appointmentId, rating, comment);
    setSubmitting(false);
    setResult(res);
  }

  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-ink p-4">
      <p className="text-sm text-cream/70">¿Cómo estuvo tu cita?</p>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={n <= rating ? "text-gold" : "text-white/20 hover:text-white/40"}
            aria-label={`${n} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos más (opcional)"
        rows={3}
        className="w-full rounded-md border border-white/20 bg-charcoal px-3 py-2 text-sm outline-none focus:border-gold"
      />
      {result && !result.ok && <p className="text-sm text-red-400">{result.error}</p>}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
      >
        {submitting ? "Enviando..." : "Enviar reseña"}
      </button>
    </div>
  );
}
