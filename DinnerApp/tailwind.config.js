/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fffaf0',
        sunny: '#fff3d6',
        mint: '#dcfce7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(17, 24, 39, 0.06)',
        pop: '0 8px 24px rgba(17, 24, 39, 0.10)',
      },
    },
  },
  plugins: [],
};
