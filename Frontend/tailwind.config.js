export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: "rgb(var(--color-app-bg) / <alpha-value>)",
        appSurface: "rgb(var(--color-app-surface) / <alpha-value>)",
        appMuted: "rgb(var(--color-app-muted) / <alpha-value>)",
        appBorder: "rgb(var(--color-app-border) / <alpha-value>)",
        appText: "rgb(var(--color-app-text) / <alpha-value>)",
        appSubtext: "rgb(var(--color-app-subtext) / <alpha-value>)",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        brandDeep: "rgb(var(--color-brand-deep) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        badgeBlueBg: "rgb(var(--color-badge-blue-bg) / <alpha-value>)",
        badgeBlueText: "rgb(var(--color-badge-blue-text) / <alpha-value>)",
        badgePurpleBg: "rgb(var(--color-badge-purple-bg) / <alpha-value>)",
        badgePurpleText: "rgb(var(--color-badge-purple-text) / <alpha-value>)",
        badgeRedBg: "rgb(var(--color-badge-red-bg) / <alpha-value>)",
        badgeRedText: "rgb(var(--color-badge-red-text) / <alpha-value>)",
        badgeGrayBg: "rgb(var(--color-badge-gray-bg) / <alpha-value>)",
        badgeGrayText: "rgb(var(--color-badge-gray-text) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}