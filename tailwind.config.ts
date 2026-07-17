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
    },
  },
  plugins: [],
};
export default config;
