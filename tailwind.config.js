/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#f59e0b',
          retroRed: '#ef4444',
          retroGold: '#fbbf24',
          retroGreen: '#10b981',
          retroBlue: '#3b82f6',
        }
      },
      fontFamily: {
        retro: ['"Press Start 2P"', 'monospace', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
