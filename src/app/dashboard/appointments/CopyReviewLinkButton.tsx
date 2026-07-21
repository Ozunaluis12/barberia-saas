"use client";

import { useState } from "react";

export default function CopyReviewLinkButton({ appointmentId }: { appointmentId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/cita/${appointmentId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleClick} className="text-xs text-gold hover:underline">
      {copied ? "¡Copiado!" : "Copiar enlace para pedir reseña"}
    </button>
  );
}
