/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        kec: {
          sidebar: "#252D3D",
          sidebarDark: "#1F2633",
          purple: "#6D4CC2",
          purpleActive: "#7554D9",
          purpleHover: "#5B3FB0",
          bg: "#F5F6FA",
          card: "#FFFFFF",
          border: "#E5E7EB",
          text: "#1F2937",
          secondary: "#6B7280",
          muted: "#9CA3AF"
        }
      }
    }
  },
  plugins: []
};
