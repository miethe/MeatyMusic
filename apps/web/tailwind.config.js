module.exports = {
  presets: [require('@meatymusic/tokens/dist/tailwind-preset')],
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '18px', letterSpacing: '0.01em' }],
        'sm': ['14px', { lineHeight: '21px', letterSpacing: '0' }],
        'base': ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        'lg': ['18px', { lineHeight: '28px', letterSpacing: '0' }],
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '0' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '0' }],
        '3xl': ['30px', { lineHeight: '39px', letterSpacing: '-0.01em' }],
        '4xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.01em' }],
        '5xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
        xs: '4px',
        pill: '9999px',
      },
      boxShadow: {
        'elevation-1': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'elevation-3': '0 8px 24px rgba(0, 0, 0, 0.25)',
        'elevation-4': '0 16px 32px rgba(0, 0, 0, 0.3)',
        'elevation-5': '0 24px 48px rgba(0, 0, 0, 0.35)',
        'accent-glow': '0 0 20px rgba(91, 76, 250, 0.4)',
        'accent-glow-lg': '0 0 32px rgba(91, 76, 250, 0.5)',
      },
      animation: {
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        'micro': '70ms',
        'ui': '150ms',
        'panel': '250ms',
        'modal': '300ms',
      },
      transitionTimingFunction: {
        'enter': 'cubic-bezier(0, 0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      animationDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #5b4cfa 0%, #6366f1 100%)',
        'gradient-mesh': `radial-gradient(at 0% 0%, rgba(91, 76, 250, 0.15) 0px, transparent 50%),
                          radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
                          radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.1) 0px, transparent 50%),
                          radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 50%)`,
      },
      colors: {
        // MeatyMusic-specific color aliases mapped to token system
        'bg-base': 'var(--mp-color-bg)',
        'bg-surface': 'var(--mp-color-surface)',
        'bg-elevated': 'var(--mp-color-panel)',
        'bg-overlay': '#2d2742',
        'bg-muted': 'var(--mp-color-surface)',

        'text-primary': 'var(--mp-color-text-strong)',
        'text-secondary': '#b8bcc8',
        'text-muted': 'var(--mp-color-text-muted)',
        'text-inverse': 'var(--mp-color-bg)',
        'text-accent': '#8b87ff',

        'border-default': 'var(--mp-color-border)',
        'border-strong': '#3f3a56',
        'border-subtle': '#1f1b2e',
        'border-accent': '#5b4cfa',

        // Primary needs hardcoded value for opacity support
        'primary': '#6366f1',

        // Semantic color backgrounds for badges
        success: {
          bg: 'rgba(34, 197, 94, 0.1)',
        },
        warning: {
          bg: 'rgba(249, 115, 22, 0.1)',
        },
        error: {
          bg: 'rgba(239, 68, 68, 0.1)',
        },
        info: {
          bg: 'rgba(59, 130, 246, 0.1)',
        },
      },
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities, theme }) {
      const animationDelays = theme('animationDelay');
      const utilities = Object.entries(animationDelays).reduce((acc, [key, value]) => {
        acc[`.animation-delay-${key}`] = { animationDelay: value };
        return acc;
      }, {});
      addUtilities(utilities);
    },
  ],
}
