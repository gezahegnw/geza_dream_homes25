/******** Tailwind Config ********/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B3C5D", // navy
          gold: "#D4AF37",
          light: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
