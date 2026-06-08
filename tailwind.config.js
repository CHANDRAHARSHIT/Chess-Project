/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B1020',
          surface: '#111827',
          accent: '#6366F1',
          text: '#F8FAFC',
          secondary: '#94A3B8',
          border: 'rgba(255, 255, 255, 0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

