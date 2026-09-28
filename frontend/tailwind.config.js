/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fdf3f4',
          100: '#fbe5e7',
          200: '#f6ced4',
          300: '#efabb5',
          400: '#e37c8c',
          500: '#d35266',
          600: '#bd374d',
          700: '#9f293b',
          800: '#852535',
          900: '#712330',
          950: '#3f1018',
        }
      }
    },
  },
  plugins: [],
}