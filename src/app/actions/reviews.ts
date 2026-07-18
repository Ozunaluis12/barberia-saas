"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

/** El cliente deja una reseña desde la página pública de su cita, una vez completada. */
export async function submitReview(
  appointmentId: string,
  rating: number,
  comment: string
): Promise<SubmitReviewResult> {
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "La calificación debe ser de 1 a 5." };
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { review: true },
  });
  if (!appt) return { ok: false, error: "Cita no encontrada." };
  if (appt.status !== "COMPLETED") {
    return { ok: false, error: "Solo puedes dejar una reseña de una cita completada." };
  }
  if (appt.review) {
    return { ok: false, error: "Ya dejaste una reseña para esta cita." };
  }

  await prisma.review.create({
    data: {
      businessId: appt.businessId,
      appointmentId: appt.id,
      clientId: appt.clientId,
      staffId: appt.staffId,
      rating: Math.round(rating),
      comment: comment.trim() || null,
    },
  });

  revalidatePath(`/cita/${appointmentId}`);
  revalidatePath("/dashboard/reviews");

  return { ok: true };
}

export async function getBusinessReviews() {
  const session = await requireSession();
  return prisma.review.findMany({
    where: { businessId: session.businessId },
    include: { client: true, staff: true },
    orderBy: { createdAt: "desc" },
  });
}
