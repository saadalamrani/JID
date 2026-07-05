import type { Config } from 'tailwindcss'
import { colors, motion, radii, shadows, spacing, typography } from './src/config/design-tokens'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jid-olive': colors.olive,
        'jid-gold': colors.gold,
        'jid-beige': colors.beige,
        'jid-ink': colors.ink,
        'jid-line': colors.line,
      },
      spacing,
      fontFamily: {
        arabic: [...typography.fontFamily.arabic],
        latin: [...typography.fontFamily.latin],
        mono: [...typography.fontFamily.mono],
      },
      fontSize: {
        xs: [...typography.fontSize.xs],
        sm: [...typography.fontSize.sm],
        base: [...typography.fontSize.base],
        lg: [...typography.fontSize.lg],
        xl: [...typography.fontSize.xl],
        '2xl': [...typography.fontSize['2xl']],
        '3xl': [...typography.fontSize['3xl']],
        '4xl': [...typography.fontSize['4xl']],
        '5xl': [...typography.fontSize['5xl']],
      },
      fontWeight: typography.fontWeight,
      borderRadius: radii,
      boxShadow: shadows,
      keyframes: motion.keyframes,
      animation: motion.animation,
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
    },
  },
  plugins: [],
}

export default config
