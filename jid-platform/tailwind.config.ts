import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import typographyPlugin from '@tailwindcss/typography'
import { colors, motion, radii, shadows, spacing, typography } from './src/config/design-tokens'
import { semanticThemePlugin } from './src/config/semantic-theme-plugin'

const fontSize2xl = typography.fontSize['2xl']
const fontSize3xl = typography.fontSize['3xl']
const fontSize4xl = typography.fontSize['4xl']
const fontSize5xl = typography.fontSize['5xl']

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        'jid-olive': colors.olive,
        'jid-gold': colors.gold,
        'jid-beige': colors.beige,
        'jid-ink': colors.ink,
        'jid-line': colors.line,
        /** Foundation Day semantic layer — auto-themed via --color-* CSS variables */
        sem: {
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          card: 'var(--color-card)',
          border: 'var(--color-border)',
          'text-primary': 'var(--color-text-primary)',
          'text-secondary': 'var(--color-text-secondary)',
          gold: 'var(--color-gold)',
          olive: 'var(--color-olive)',
          danger: 'var(--color-danger)',
          warning: 'var(--color-warning)',
        },
      },
      spacing,
      fontFamily: {
        arabic: ['var(--font-arabic)', ...typography.fontFamily.arabic.slice(1)],
        latin: ['var(--font-latin)', ...typography.fontFamily.latin.slice(1)],
        display: ['var(--font-latin)', ...typography.fontFamily.latin.slice(1)],
        mono: ['var(--font-mono)', ...typography.fontFamily.mono.slice(1)],
      },
      fontSize: {
        xs: [...typography.fontSize.xs],
        sm: [...typography.fontSize.sm],
        base: [...typography.fontSize.base],
        lg: [...typography.fontSize.lg],
        xl: [...typography.fontSize.xl],
        '2xl': [...fontSize2xl],
        '3xl': [...fontSize3xl],
        '4xl': [...fontSize4xl],
        '5xl': [...fontSize5xl],
      },
      fontWeight: typography.fontWeight,
      borderRadius: {
        ...radii,
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: shadows,
      keyframes: {
        ...motion.keyframes,
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        ...motion.animation,
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      transitionDuration: {
        instant: motion.duration.instant,
        fast: motion.duration.fast,
        normal: motion.duration.normal,
        slow: motion.duration.slow,
        slower: motion.duration.slower,
      },
      transitionTimingFunction: {
        jid: motion.easing.default,
        'jid-in': motion.easing.in,
        'jid-out': motion.easing.out,
        'jid-in-out': motion.easing.inOut,
        'jid-spring': motion.easing.spring,
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        jid: {
          css: {
            '--tw-prose-body': theme('colors.jid-ink.DEFAULT'),
            '--tw-prose-headings': theme('colors.jid-olive.DEFAULT'),
            '--tw-prose-lead': theme('colors.jid-ink.DEFAULT'),
            '--tw-prose-links': theme('colors.jid-olive.DEFAULT'),
            '--tw-prose-bold': theme('colors.jid-ink.DEFAULT'),
            '--tw-prose-counters': theme('colors.jid-gold.DEFAULT'),
            '--tw-prose-bullets': theme('colors.jid-line.DEFAULT'),
            '--tw-prose-hr': theme('colors.jid-line.DEFAULT'),
            '--tw-prose-quotes': theme('colors.jid-olive.DEFAULT'),
            '--tw-prose-quote-borders': theme('colors.jid-gold.DEFAULT'),
            '--tw-prose-captions': theme('colors.jid-ink.DEFAULT'),
            '--tw-prose-code': theme('colors.jid-olive.DEFAULT'),
            '--tw-prose-pre-code': theme('colors.jid-beige.DEFAULT'),
            '--tw-prose-pre-bg': theme('colors.jid-olive.800'),
            '--tw-prose-th-borders': theme('colors.jid-line.DEFAULT'),
            '--tw-prose-td-borders': theme('colors.jid-line.DEFAULT'),
            color: theme('colors.jid-ink.DEFAULT'),
            maxWidth: 'none',
            lineHeight: '1.75',
            a: {
              color: theme('colors.jid-olive.DEFAULT'),
              fontWeight: '500',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              '&:hover': {
                color: theme('colors.jid-gold.DEFAULT'),
              },
            },
            h2: {
              marginTop: '2.5em',
              marginBottom: '0.75em',
              fontWeight: '600',
            },
            h3: {
              marginTop: '1.75em',
              marginBottom: '0.5em',
              fontWeight: '600',
              color: theme('colors.jid-olive.DEFAULT'),
            },
            'ul > li::marker': {
              color: theme('colors.jid-gold.DEFAULT'),
            },
          },
        },
      }),
    },
  },
  plugins: [semanticThemePlugin, tailwindcssAnimate, typographyPlugin],
}

export default config
