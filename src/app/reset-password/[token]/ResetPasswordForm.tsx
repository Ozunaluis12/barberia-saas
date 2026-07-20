"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: true } | { ok: false; error: string } | null>(null);

  if (result?.ok) {
    return (
      <div className="mt-6 space-y-4">
        <p className="rounded-md bg-green-500/10 px-3 py-3 text-sm text-green-400">
          Tu contraseña se actualizó correctamente.
        </p>
        <Link
          href="/login"
          className="block w-full rounded-md bg-gold px-4 py-2 text-center font-semibold text-ink hover:bg-gold/90"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setResult({ ok: false, error: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (password !== confirm) {
      setResult({ ok: false, error: "Las contraseñas no coinciden." });
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.set("password", password);
    const res = await resetPassword(token, fd);
    setSubmitting(false);
    setResult(res);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="text-sm text-cream/70">Nueva contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
        />
      </div>
      <div>
        <label className="text-sm text-cream/70">Confirma la contraseña</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
          className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 outline-none focus:border-gold"
        />
      </div>
      {result && !result.ok && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{result.error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gold px-4 py-2 font-semibold text-ink disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
