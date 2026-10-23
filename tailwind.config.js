/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf3', 100: '#d6f9e1', 200: '#b0f1c8', 300: '#79e4a6',
          400: '#43cd80', 500: '#1eb25f', 600: '#12904c', 700: '#117240',
          800: '#135b36', 900: '#114a2f', 950: '#06291a',
        },
        ink: {
          50: '#f6f7f9', 100: '#eceef2', 200: '#d4d9e3', 300: '#aeb7c9',
          400: '#8290aa', 500: '#647392', 600: '#4f5b78', 700: '#414b62',
          800: '#394053', 900: '#1f2433', 950: '#141826',
        },
        gold: {
          400: '#f0c040', 500: '#e0a818', 600: '#b88410',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
