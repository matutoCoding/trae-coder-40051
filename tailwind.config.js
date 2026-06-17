/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e3a5f",
          900: "#1e3a5f",
          950: "#172554",
        },
        industrial: {
          50: "#f0f5fa",
          100: "#dde7f2",
          200: "#b5cae0",
          300: "#82a4c9",
          400: "#4f7cac",
          500: "#2f5d8e",
          600: "#264a74",
          700: "#203c5e",
          800: "#1d3450",
          900: "#1b2c44",
          950: "#0f1a2c",
        },
        status: {
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#0ea5e9",
          pending: "#64748b",
        },
      },
      fontFamily: {
        sans: [
          "PingFang SC",
          "Microsoft YaHei",
          "Segoe UI",
          "Noto Sans",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(30, 58, 95, 0.1), 0 1px 2px -1px rgba(30, 58, 95, 0.05)",
        "card-hover":
          "0 10px 15px -3px rgba(30, 58, 95, 0.08), 0 4px 6px -4px rgba(30, 58, 95, 0.05)",
      },
    },
  },
  plugins: [],
};
