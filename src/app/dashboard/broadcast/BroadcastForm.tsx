"use client";

import { useState } from "react";
import { sendBroadcast, type BroadcastResult } from "@/app/actions/broadcast";

export default function BroadcastForm() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    const res = await sendBroadcast(message);
    setSending(false);
    setResult(res);
    if (res.ok) setMessage("");
  }

  return (
    <div className="max-w-lg space-y-4 rounded-lg border border-white/10 bg-charcoal p-6">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Ej: ¡Esta semana tenemos 20% de descuento en cortes!"
        className="w-full rounded-md border border-white/20 bg-ink px-3 py-2 text-sm outline-none focus:border-gold"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="rounded-md bg-gold px-4 py-2 font-semibold text-ink disabled:opacity-40"
      >
        {sending ? "Enviando..." : "Enviar a todos mis clientes"}
      </button>

      {result && !result.ok && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{result.error}</p>
      )}
      {result && result.ok && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Enviado a {result.sent} de {result.total} clientes
          {result.failed > 0 && ` (${result.failed} fallaron, revisa que los teléfonos sean válidos)`}.
        </p>
      )}
    </div>
  );
}
