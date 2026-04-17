/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bolivar: {
          900: '#1A3C0E',
          800: '#1E4A12',
          700: '#245A16',
          600: '#2E7D32',
          500: '#4CAF50',
          400: '#76C442',
          300: '#A5D67B',
          200: '#C8E6B4',
          100: '#E8F5E1',
          50: '#F5F7F2',
        },
        gold: {
          500: '#F9A825',
          400: '#FBC02D',
          300: '#FDD835',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
