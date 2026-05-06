import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#ffffff",
          ink: "#0a0a0a",
          muted: "#6b6b6b",
          line: "#e5e5e5",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
