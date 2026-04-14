/******** Tailwind Config ********/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#059669", // emerald green
          gold: "#D4AF37",
          light: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
