export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: "#f3f5f9",
        appSurface: "#ffffff",
        appMuted: "#f1f4f8",
        appBorder: "#dce3eb",
        appText: "#1f2937",
        appSubtext: "#64748b",
        brand: "#2b5bb5",
        brandDeep: "#1a4ea8",
        danger: "#b3414b",
        success: "#2f855a",
        badgeBlueBg: "#dbeafe",
        badgeBlueText: "#1d4ed8",
        badgePurpleBg: "#ede9fe",
        badgePurpleText: "#5b21b6",
        badgeRedBg: "#fee2e2",
        badgeRedText: "#b91c1c",
        badgeGrayBg: "#e2e8f0",
        badgeGrayText: "#334155",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 10px 30px -5px rgba(42, 52, 57, 0.08)",
      },
    },
  },
  plugins: [],
}