/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbe8',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontSize: {
        'senior-sm': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'senior-base': ['1.25rem', { lineHeight: '1.875rem' }], // 20px
        'senior-lg': ['1.5rem', { lineHeight: '2rem' }], // 24px
        'senior-xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        'senior-2xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      }
    },
  },
  plugins: [],
}
