"use client";

import { useState } from "react";

export default function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name="password"
        required
        className="mt-1 w-full rounded-md border border-white/20 bg-ink px-3 py-2 pr-16 outline-none focus:border-gold"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 mt-0.5 text-xs text-cream/50 hover:text-gold"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
