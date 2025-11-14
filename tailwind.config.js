/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
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
      },
      animation: {
        // ... your other animations
        'spin-slow': 'spin 5s linear infinite', // We create a custom slow-spin utility
        'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}