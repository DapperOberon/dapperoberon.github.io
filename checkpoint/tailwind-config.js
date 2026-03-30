tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0a0b0c",
        surface: "#111315",
        "surface-elevated": "#171a1d",
        "surface-panel": "#1b1f23",
        "surface-panel-2": "#232830",
        "surface-border": "#2f3740",
        primary: "#a8e8ff",
        "primary-container": "#00d4ff",
        "primary-strong": "#48deff",
        secondary: "#8dc0d2",
        "on-surface": "#edf5f8",
        "on-surface-muted": "#9ba9b3",
        success: "#73f0bc",
        warning: "#ffcc74",
        danger: "#ff8c8c"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Manrope", "sans-serif"],
        label: ["Space Grotesk", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 32px rgba(0, 212, 255, 0.24)",
        panel: "0 24px 60px rgba(0, 0, 0, 0.42)"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      }
    }
  }
};
