"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export default function NavDropdown({ label, items }: { label: string; items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold"
        aria-expanded={open}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 animate-modalIn rounded-xl border border-white/10 bg-charcoal p-2 shadow-2xl shadow-black/40">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-cream/80 transition-colors hover:bg-gold/10 hover:text-gold"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-cream/80 transition-colors hover:bg-gold/10 hover:text-gold"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
