import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CorteYa — Agenda para barberías",
  description:
    "Software de reservas para barberías con varios barberos: el cliente elige a su barbero de confianza o deja que el sistema le asigne el más disponible. Sin comisiones ocultas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
