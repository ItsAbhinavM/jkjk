/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#F4F1FA", // soft lavender page background
        tonal: "#EEE9F6", // inset fields and chips
      },
      fontFamily: {
        sans: ["Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Barlow Condensed", "Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};