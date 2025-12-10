/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      keyframes: {
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
          },
          shimmer: {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        // ... your other animations
        'spin-slow': 'spin 5s linear infinite', // We create a custom slow-spin utility
        'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
        'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
    },
    fontFamily: {
        sans: ["Montserrat", ...fontFamily.sans],
    },
  },
  plugins: [require("tailwindcss-animate")],
}