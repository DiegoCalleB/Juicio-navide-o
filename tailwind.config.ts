import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        court: { bg: '#0a1a12', card: '#12281c', line: '#1f3d2c', red: '#e5383b', gold: '#f4c542', snow: '#f8fafc' },
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: { pop: 'pop 200ms ease-out' },
    },
  },
  plugins: [],
};
export default config;
