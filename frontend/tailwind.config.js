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
          850: '#5c1722',
          900: '#712330',
          950: '#46131c',
        },
        gold: {
          50: '#fbf8ee',
          100: '#f6efd5',
          200: '#ecddab',
          300: '#dec37a',
          400: '#cca54a',
          500: '#b88c32',
          600: '#9b6e27',
          700: '#7a5122',
          800: '#664221',
          900: '#563720',
          950: '#321c0e',
        },
        sandstone: {
          50: '#faf8f5',
          100: '#f3efe6',
          200: '#e7ded0',
          300: '#d6c5b0',
          400: '#c0a68c',
          500: '#ab8b6e',
          600: '#977557',
          700: '#7a5c44',
          800: '#634b39',
          900: '#523f31',
          950: '#2b2019',
        },
        ivory: {
          50: '#fffefc',
          100: '#fdfbf7',
          200: '#faf6ee',
          300: '#f5eee0',
          400: '#ede0cb',
        },
        charcoal: {
          50: '#f6f6f7',
          100: '#e2e2e5',
          200: '#c5c5cb',
          300: '#a3a3ad',
          400: '#7a7a87',
          500: '#5e5e6b',
          600: '#484852',
          700: '#37373f',
          800: '#27272c',
          900: '#1b1b1e',
          950: '#111113',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'heritage-sm': '0 2px 10px -1px rgba(113, 35, 48, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'heritage': '0 8px 24px -4px rgba(113, 35, 48, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'heritage-lg': '0 16px 36px -6px rgba(113, 35, 48, 0.12), 0 6px 12px -2px rgba(0, 0, 0, 0.06)',
        'heritage-glow': '0 0 25px rgba(204, 165, 74, 0.25)',
      }
    },
  },
  plugins: [],
}