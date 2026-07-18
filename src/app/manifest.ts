import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Turnify — Agenda de citas para cualquier negocio",
    short_name: "Turnify",
    description:
      "Agenda de citas para barberías, salones, spas, consultorios, veterinarias, talleres y gimnasios.",
    start_url: "/",
    display: "standalone",
    background_color: "#161311",
    theme_color: "#d4a441",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
