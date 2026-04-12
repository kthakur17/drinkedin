/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060b18',
          900: '#0a0f1e',
          800: '#0d1530',
          700: '#111d40',
          600: '#162050',
          500: '#1e2d6b',
        },
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
        },
        amber: {
          glow: '#f0c040',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #060b18 0%, #0a0f1e 50%, #0d1530 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f0c040 0%, #d97706 100%)',
        'card-gradient': 'linear-gradient(145deg, #0d1530 0%, #111d40 100%)',
      },
      boxShadow: {
        'gold': '0 0 20px rgba(240, 192, 64, 0.15)',
        'gold-lg': '0 0 40px rgba(240, 192, 64, 0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSub 0.5s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 10px rgba(240,192,64,0.2)' }, '50%': { boxShadow: '0 0 24px rgba(240,192,64,0.5)' } },
        bounceSub: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
      },
    },
  },
  plugins: [],
};
