/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Primary — soft indigo / violet */
        iris: {
          50: '#F2F1FE',
          100: '#E6E3FD',
          200: '#CDC7FB',
          300: '#ADA4F7',
          400: '#8B7DF3',
          500: '#6C5CE7',
          600: '#5A47D8',
          700: '#4A37B8',
          800: '#3D2F94',
          900: '#2E2570',
        },
        /* Accent — electric cyan */
        aqua: {
          50: '#E6FBFF',
          100: '#CFF6FE',
          200: '#9BECF9',
          300: '#5FDDF4',
          400: '#2FC9E8',
          500: '#12A9CC',
          600: '#0B87A6',
          700: '#0D6C85',
        },
        /* Highlight — coral / pink */
        coral: {
          50: '#FFF1F3',
          100: '#FFE0E5',
          200: '#FFC5D0',
          300: '#FF9DB2',
          400: '#FF6F8F',
          500: '#F4507A',
          600: '#E0315C',
        },
        /* Supporting */
        mint: {
          100: '#DCFCEB',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        amber: {
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
        },
        /* Neutrals with a violet tint so the UI never feels flat grey */
        ink: '#1B1533',
        'ink-soft': '#4B4470',
        mist: '#F7F5FF',
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,21,51,0.04), 0 8px 24px -8px rgba(108,92,231,0.18)',
        lift: '0 2px 4px rgba(27,21,51,0.05), 0 18px 40px -12px rgba(108,92,231,0.32)',
        glow: '0 0 0 1px rgba(108,92,231,0.12), 0 12px 40px -12px rgba(47,201,232,0.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      backgroundImage: {
        'iris-aqua': 'linear-gradient(120deg, #6C5CE7 0%, #8B7DF3 45%, #12A9CC 100%)',
        'iris-coral': 'linear-gradient(120deg, #6C5CE7 0%, #F4507A 100%)',
        'soft-mesh':
          'radial-gradient(1000px 600px at 10% -10%, rgba(108,92,231,0.16), transparent 60%), radial-gradient(900px 600px at 90% 0%, rgba(18,169,204,0.16), transparent 55%), radial-gradient(700px 500px at 50% 110%, rgba(244,80,122,0.12), transparent 60%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        drift: {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(18px,-14px) scale(1.06)' },
          '100%': { transform: 'translate(0,0) scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.92)', opacity: '0.7' },
          '70%': { transform: 'scale(1.08)', opacity: '0' },
          '100%': { transform: 'scale(1.08)', opacity: '0' },
        },
        dash: {
          to: { strokeDashoffset: '-1000' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(28px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'bar-grow': {
          from: { transform: 'scaleY(0.2)', opacity: '0.4' },
          to: { transform: 'scaleY(1)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        drift: 'drift 14s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.8s cubic-bezier(0.4,0,0.6,1) infinite',
        dash: 'dash 6s linear infinite',
        rise: 'rise 0.5s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.8s infinite',
        'fade-in': 'fade-in 0.35s ease both',
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'bar-grow': 'bar-grow 0.6s cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [],
};