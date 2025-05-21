/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d6eaff',
          200: '#b5dbff',
          300: '#85c5ff',
          400: '#4aa3ff',
          500: '#0070F3',
          600: '#0057c3',
          700: '#0044a0',
          800: '#003b84',
          900: '#00326e',
          950: '#001f47'
        },
      }
    },
  },
  plugins: [],
};