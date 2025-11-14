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
        // MeatyMusic Dark Mode Design System
        // Background layers
        'bg-base': '#0f0f1c',
        'bg-surface': '#1a1625',
        'bg-elevated': '#252137',
        'bg-overlay': '#2d2742',
        'bg-muted': '#1a1625',

        // Text colors
        'text-primary': '#f8f9fc',
        'text-secondary': '#b8bcc8',
        'text-muted': '#7c7f8c',
        'text-inverse': '#0f0f1c',
        'text-accent': '#8b87ff',

        // Border colors
        'border-default': '#2d2742',
        'border-strong': '#3f3a56',
        'border-subtle': '#1f1b2e',
        'border-accent': '#5b4cfa',

        // Primary accent (purple-blue)
        primary: {
          900: '#3730a3',
          700: '#5b4cfa',
          500: '#6366f1',
          300: '#a5b4fc',
          100: '#e0e7ff',
          DEFAULT: '#6366f1',
          foreground: '#f8f9fc',
        },

        // Secondary accent (purple)
        secondary: {
          700: '#7c3aed',
          500: '#a78bfa',
          300: '#c4b5fd',
          DEFAULT: '#a78bfa',
          foreground: '#f8f9fc',
        },

        // Semantic colors
        success: {
          700: '#15803d',
          500: '#22c55e',
          300: '#86efac',
          bg: 'rgba(34, 197, 94, 0.1)',
          DEFAULT: '#22c55e',
        },
        warning: {
          700: '#c2410c',
          500: '#f97316',
          300: '#fdba74',
          bg: 'rgba(249, 115, 22, 0.1)',
          DEFAULT: '#f97316',
        },
        error: {
          700: '#b91c1c',
          500: '#ef4444',
          300: '#fca5a5',
          bg: 'rgba(239, 68, 68, 0.1)',
          DEFAULT: '#ef4444',
        },
        info: {
          700: '#0369a1',
          500: '#3b82f6',
          300: '#93c5fd',
          bg: 'rgba(59, 130, 246, 0.1)',
          DEFAULT: '#3b82f6',
        },

        // Shadcn compatibility
        background: '#0f0f1c',
        foreground: '#f8f9fc',
        card: {
          DEFAULT: '#1a1625',
          foreground: '#f8f9fc'
        },
        popover: {
          DEFAULT: '#252137',
          foreground: '#f8f9fc'
        },
        muted: {
          DEFAULT: '#2d2742',
          foreground: '#b8bcc8'
        },
        accent: {
          DEFAULT: '#6366f1',
          foreground: '#f8f9fc'
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#f8f9fc'
        },
        border: '#2d2742',
        input: '#2d2742',
        ring: '#5b4cfa',
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
