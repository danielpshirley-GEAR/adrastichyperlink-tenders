import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Gallery Editorial Palette
        gallery: {
          canvas: "#fafaf9",       // Warm off-white background
          surface: "#ffffff",      // Crisp pure white cards & panels
          surfaceMuted: "#f4f4f5", // Subtle background for tags & counters
          border: "#e4e4e7",       // Clean hairline borders
          borderSubtle: "#f4f4f5",
          charcoal: "#18181b",     // High-density primary typography
          charcoalSecondary: "#27272a",
          muted: "#71717a",        // Subdued secondary text
          faint: "#a1a1aa",        // Placeholders and technical annotations
        },
        // Restrained Deep Teal Accent
        tender: {
          primary: "#0f4c47",      // Deep editorial teal
          primaryHover: "#134e48",
          primaryLight: "#f0fdfa",
          primaryBorder: "#99f6e4",
        },
        // Semantic Verification & Status Tokens
        qualification: {
          strong: "#059669",
          strongBg: "#ecfdf5",
          strongBorder: "#a7f3d0",
          possible: "#0284c7",
          possibleBg: "#f0f9ff",
          possibleBorder: "#bae6fd",
          weak: "#d97706",
          weakBg: "#fffbeb",
          weakBorder: "#fde68a",
          reject: "#e11d48",
          rejectBg: "#fff1f2",
          rejectBorder: "#fecdd3",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Inter",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.02em",
        tight: "-0.01em",
      },
    },
  },
  plugins: [],
};

export default config;
