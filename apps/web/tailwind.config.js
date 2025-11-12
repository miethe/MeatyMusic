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
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // MeatyMusic radius tokens
        'mm-sm': 'var(--mm-radius-sm)',
        'mm-md': 'var(--mm-radius-md)',
        'mm-lg': 'var(--mm-radius-lg)',
        'mm-pill': 'var(--mm-radius-pill)',
      },
      boxShadow: {
        'elev0': 'var(--mm-elevation-0)',
        'elev1': 'var(--mm-elevation-1)',
        'elev2': 'var(--mm-elevation-2)',
        'elev3': 'var(--mm-elevation-3)',
        'elev4': 'var(--mm-elevation-4)',
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        '70': '70ms',
        '250': '250ms',
        // MeatyMusic motion duration tokens
        'micro': 'var(--mm-motion-duration-micro)',
        'ui': 'var(--mm-motion-duration-ui)',
        'panel': 'var(--mm-motion-duration-panel)',
        'modal': 'var(--mm-motion-duration-modal)',
      },
      transitionTimingFunction: {
        // MeatyMusic motion easing tokens
        'enter': 'var(--mm-motion-easing-enter)',
        'exit': 'var(--mm-motion-easing-exit)',
      },
      colors: {
        // HSL-based variables (shadcn/ui compatibility)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'sidebar-background': 'hsl(var(--sidebar-background))',

        // MeatyMusic color tokens - Base colors
        'mm-bg': 'var(--mm-color-bg)',
        'mm-surface': 'var(--mm-color-surface)',
        'mm-panel': 'var(--mm-color-panel)',
        'mm-border': 'var(--mm-color-border)',
        'mm-ring': 'var(--mm-color-ring)',

        // MeatyMusic color tokens - Text colors
        'mm-text-strong': 'var(--mm-color-text-strong)',
        'mm-text-base': 'var(--mm-color-text-base)',
        'mm-text-muted': 'var(--mm-color-text-muted)',

        // MeatyMusic color tokens - Semantic colors
        'mm-primary': 'var(--mm-color-primary)',
        'mm-primary-foreground': 'var(--mm-color-primaryForeground)',
        'mm-secondary': 'var(--mm-color-secondary)',
        'mm-accent': 'var(--mm-color-accent)',
        'mm-success': 'var(--mm-color-success)',
        'mm-warning': 'var(--mm-color-warning)',
        'mm-danger': 'var(--mm-color-danger)',
        'mm-info': 'var(--mm-color-info)',

        // MeatyMusic color tokens - Collection colors
        'mm-collection-primary': 'var(--mm-color-collection-primary)',
        'mm-collection-secondary': 'var(--mm-color-collection-secondary)',
        'mm-collection-accent': 'var(--mm-color-collection-accent)',
        'mm-collection-purple': 'var(--mm-color-collection-purple)',
        'mm-collection-green': 'var(--mm-color-collection-green)',
        'mm-collection-orange': 'var(--mm-color-collection-orange)',
        'mm-collection-blue': 'var(--mm-color-collection-blue)',
        'mm-collection-red': 'var(--mm-color-collection-red)',

        // MeatyMusic Badge tokens - Light/Dark mode aware colors
        'mm-badge-outline': {
          bg: 'var(--mm-badge-outline-bg)',
          border: 'var(--mm-badge-outline-border)',
          text: 'var(--mm-badge-outline-text)',
          'hover-bg': 'var(--mm-badge-outline-hover-bg)',
          'hover-border': 'var(--mm-badge-outline-hover-border)',
        },
        'mm-badge-default': {
          bg: 'var(--mm-badge-default-bg)',
          border: 'var(--mm-badge-default-border)',
          text: 'var(--mm-badge-default-text)',
          'hover-bg': 'var(--mm-badge-default-hover-bg)',
        },
        'mm-badge-secondary': {
          bg: 'var(--mm-badge-secondary-bg)',
          border: 'var(--mm-badge-secondary-border)',
          text: 'var(--mm-badge-secondary-text)',
          'hover-bg': 'var(--mm-badge-secondary-hover-bg)',
        },

        // MeatyMusic Complication tokens
        'mm-complication-prompt-type': {
          bg: 'var(--mm-complication-prompt-type-bg)',
          border: 'var(--mm-complication-prompt-type-border)',
          text: 'var(--mm-complication-prompt-type-text)',
        },
        'mm-complication-permission': {
          bg: 'var(--mm-complication-permission-bg)',
          border: 'var(--mm-complication-permission-border)',
          text: 'var(--mm-complication-permission-text)',
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
}
