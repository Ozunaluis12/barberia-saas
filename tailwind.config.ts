import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161311",
        charcoal: "#1f1b19",
        gold: "#d4a441",
        cream: "#f5f0e8",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(8px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        blobMove: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(24px, -28px) scale(1.06)" },
          "66%": { transform: "translate(-20px, 18px) scale(0.94)" },
        },
        gradientMove: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,164,65,0.45)" },
          "50%": { boxShadow: "0 0 0 12px rgba(212,164,65,0)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        modalIn: "modalIn 0.25s ease-out",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        blobMove: "blobMove 14s ease-in-out infinite",
        gradientMove: "gradientMove 6s ease infinite",
        glowPulse: "glowPulse 2.4s ease-in-out infinite",
        slideInLeft: "slideInLeft 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
