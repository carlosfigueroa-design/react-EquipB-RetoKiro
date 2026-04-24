/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A3C0E',
        secondary: '#2E7D32',
        accent: '#76C442',
        gold: '#F9A825',
        background: '#F5F7F2',
        'sb-green': {
          50: '#F0F7EC',
          100: '#D4EDCC',
          200: '#A8DB99',
          300: '#76C442',
          400: '#4CAF50',
          500: '#2E7D32',
          600: '#1A3C0E',
          700: '#143008',
          800: '#0E2406',
          900: '#081803',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sb': '50px',
        'sb-card': '16px',
        'sb-sm': '8px',
      },
      boxShadow: {
        'sb': '0 4px 24px rgba(26, 60, 14, 0.08)',
        'sb-lg': '0 8px 40px rgba(26, 60, 14, 0.12)',
      },
    },
  },
  plugins: [],
};
