import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnify — Agenda de citas para barberías, salones y spas",
  description:
    "Software de reservas para barberías, salones de belleza y spas. El cliente elige a su especialista de confianza o deja que el sistema le asigne el más disponible. Sin comisiones ocultas.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Turnify",
  },
};

export const viewport: Viewport = {
  themeColor: "#d4a441",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
