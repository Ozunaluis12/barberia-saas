"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type DashboardNavItem = { href: string; label: string };

export default function DashboardShell({
  navItems,
  businessName,
  isOwner,
  businessSlug,
  logoutAction,
  children,
}: {
  navItems: DashboardNavItem[];
  businessName?: string | null;
  isOwner: boolean;
  businessSlug?: string | null;
  logoutAction: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebarContent = (
    <>
      <div className="px-2 py-2">
        <p className="text-lg font-bold text-gold">Turnify</p>
        <p className="truncate text-sm text-cream/60">{businessName}</p>
        {isOwner && (
          <Link
            href="/dashboard/locations"
            onClick={() => setOpen(false)}
            className="text-xs text-gold hover:underline"
          >
            Cambiar de sucursal →
          </Link>
        )}
      </div>
      <nav className="mt-6 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2.5 text-sm hover:bg-white/5"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 space-y-2 px-2">
        <Link
          href={`/book/${businessSlug}`}
          target="_blank"
          className="block text-xs text-gold hover:underline"
        >
          Ver página pública de reservas →
        </Link>
        <Link
          href={`/catalogo/${businessSlug}`}
          target="_blank"
          className="block text-xs text-gold hover:underline"
        >
          Ver catálogo público →
        </Link>
        <form action={logoutAction}>
          <button className="text-xs text-cream/50 hover:text-cream">Cerrar sesión</button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-ink text-cream md:flex">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-charcoal/95 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md text-cream hover:bg-white/5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-base font-bold text-gold">Turnify</span>
        <span className="h-9 w-9" />
      </div>

      <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-charcoal p-4 md:block">
        {sidebarContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            aria-hidden
            className="absolute inset-0 animate-fadeIn bg-black/70"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] animate-slideInLeft overflow-y-auto border-r border-white/10 bg-charcoal p-4 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="mb-2 flex h-9 w-9 items-center justify-center rounded-md text-xl leading-none text-cream/60 hover:bg-white/5 hover:text-cream"
            >
              ×
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
    </div>
  );
}
