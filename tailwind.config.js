/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan semua file di src
  ],
  theme: {
    extend: {
      zIndex: {
        1000: 1000,
        1001: 1001,
      },
      colors: {
        'google-blue': '#4285F4',
        'google-red': '#EA4335',
        'google-yellow': '#FBBC05',
        'google-green': '#34A853',
        'google-gray': '#5F6368',
      },
    },
  },
  plugins: [],
}