/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        accent: "#E50914",
        highlight: "#FFD400",
      },
    },
  },
  plugins: [],
};
