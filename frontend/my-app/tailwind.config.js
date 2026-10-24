/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
      extend: {
        fontFamily: {
          sans: ["Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
          display: ["Barlow Condensed", "Barlow", "ui-sans-serif", "system-ui", "sans-serif"],
        },
      },
    },
    plugins: [],
  };