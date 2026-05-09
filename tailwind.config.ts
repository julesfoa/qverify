import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#FF5873',
          light: '#FFF0F3',
          dark: '#E03D57',
        },
        surface: '#F5F5F7',
        card: '#FFFFFF',
        wrong: {
          DEFAULT: '#EF4444',
          bg: '#FFF0F0',
          border: '#FECACA',
        },
        correct: {
          DEFAULT: '#10B981',
          bg: '#F0FDF4',
          border: '#A7F3D0',
        },
        note: {
          DEFAULT: '#F59E0B',
          bg: '#FFFBEB',
          border: '#FDE68A',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.07)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
