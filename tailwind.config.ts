import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7fb',
          100: '#eceff7',
          200: '#d3d9ea',
          300: '#b0bbd2',
          400: '#8694b0',
          500: '#5f6c8c',
          600: '#46516d',
          700: '#323a53',
          800: '#1e2435',
          900: '#10131f',
        },
        accent: {
          50: '#f5f9ff',
          100: '#e7f0ff',
          200: '#bfd5ff',
          300: '#8ab1ff',
          400: '#5683f4',
          500: '#315ee4',
          600: '#2244b9',
          700: '#1d3690',
          800: '#182d74',
          900: '#15275f',
        },
        warm: {
          50: '#fff9f3',
          100: '#fff0df',
          200: '#ffd7aa',
          300: '#ffb66a',
          400: '#f98d2d',
          500: '#e96b18',
          600: '#c55211',
          700: '#9f3f11',
          800: '#7f3312',
          900: '#682a11',
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(16, 19, 31, 0.12)',
        glow: '0 16px 50px rgba(49, 94, 228, 0.22)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at top left, rgba(49, 94, 228, 0.20), transparent 36%), radial-gradient(circle at top right, rgba(233, 107, 24, 0.14), transparent 28%), linear-gradient(180deg, rgba(246, 247, 251, 1) 0%, rgba(236, 239, 247, 0.92) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
