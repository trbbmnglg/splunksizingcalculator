/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Graphik"', '"Graphik Web"', 'ui-sans-serif', 'system-ui',
               '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Accenture Branding Guidelines July 2025 v4.
        accenture: {
          purple: {
            darkest: '#460073',
            dark:    '#7500C0',
            DEFAULT: '#A100FF',
            light:   '#C2A3FF',
            lightest:'#E6DCFF',
          },
          black:            '#000000',
          'gray-dark':      '#818180',
          'gray-light':     '#CFCFCF',
          'gray-off-white': '#F1F1EF',
          white:            '#FFFFFF',
          pink: '#FF50A0',
          blue: '#224BFF',
          aqua: '#05F2DB',
        },
      },
    },
  },
  plugins: [],
}
