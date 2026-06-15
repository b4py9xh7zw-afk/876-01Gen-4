/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        brand: {
          50: "#F5F7FA",
          100: "#E8ECF2",
          200: "#C5D0DF",
          300: "#8FA3BF",
          400: "#536E94",
          500: "#2B4566",
          600: "#1A3354",
          700: "#0F2540",
          800: "#0B1C30",
          900: "#071321",
        },
        gold: {
          50: "#FBF8F0",
          100: "#F5EED7",
          200: "#EAD9A4",
          300: "#DEC070",
          400: "#D4AD48",
          500: "#C9A962",
          600: "#B8913E",
          700: "#957230",
          800: "#735725",
          900: "#513D19",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        gold: "0 4px 14px 0 rgba(201, 169, 98, 0.25)",
        card: "0 2px 12px rgba(15, 37, 64, 0.08)",
        "card-hover": "0 8px 24px rgba(15, 37, 64, 0.12)",
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #0F2540 0%, #1A3354 50%, #2B4566 100%)",
        "gradient-gold":
          "linear-gradient(135deg, #C9A962 0%, #D4AD48 50%, #DEC070 100%)",
        "noise":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
