/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        rca: {
          primary: '#6366f1',
          'primary-light': '#818cf8',
          'primary-dark': '#4f46e5',
          secondary: '#0ea5e9',
          'secondary-light': '#38bdf8',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card: '#ffffff',
          elevated: '#ffffff',
          muted: '#f1f5f9',
        },
        etapa: {
          inativos: '#8b5cf6',
          'primeiro-contato': '#3b82f6',
          'lead-qualificado': '#14b8a6',
          negociacao: '#f59e0b',
          'pos-venda': '#22c55e',
          'banco-potenciais': '#94a3b8',
        },
        prioridade: {
          baixa: '#64748b',
          media: '#3b82f6',
          alta: '#f59e0b',
          urgente: '#ef4444',
        },
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'soft-xl': '0 16px 48px rgba(0, 0, 0, 0.1)',
        glow: '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.2)',
      },
      borderRadius: {
        'rca-sm': '6px',
        'rca-md': '10px',
        'rca-lg': '16px',
        'rca-xl': '24px',
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '72px',
        header: '64px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out both',
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'fade-in-down': 'fadeInDown 0.4s ease-out both',
        'slide-right': 'slideRight 0.35s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'scale-in': 'scaleIn 0.25s ease-out both',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
}
