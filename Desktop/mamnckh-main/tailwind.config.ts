import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#f4f8f1',
          100: '#e4efdd',
          500: '#54885f',
          600: '#3f704d',
          700: '#315a3e',
        },
        ink: '#183027',
        sand: '#fbfaf7',
      },
      boxShadow: {
        soft: '0 14px 35px rgba(33, 71, 48, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
