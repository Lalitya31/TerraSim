/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
        },
        warm: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
        serif: ['Crimson Text', 'serif']
      },
      boxShadow: {
        'soft': '0 8px 20px rgba(8,15,63,0.06)'
      }
    },
  },
  plugins: [],
}