/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],

  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1DB97C',
        'primary-dark': '#0A8A5E',
        background: {
          light: '#F9FAFB',
          dark: '#121212',
        },
        glass: 'rgba(255,255,255,0.12)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        korean: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
