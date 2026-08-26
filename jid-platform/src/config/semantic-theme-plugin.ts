import plugin from 'tailwindcss/plugin'
import { semanticColors } from './design-tokens'

type SemanticMode = 'light' | 'dark'

function resolveSemanticColor(
  value: string | { light: string; dark: string },
  mode: SemanticMode,
): string {
  return typeof value === 'string' ? value : value[mode]
}

function semanticCssVariables(mode: SemanticMode): Record<string, string> {
  const foreground = resolveSemanticColor(semanticColors.foreground, mode)
  const primary = resolveSemanticColor(semanticColors.primary, mode)
  const accent = resolveSemanticColor(semanticColors.accent, mode)
  const focus = resolveSemanticColor(semanticColors.focus, mode)

  return {
    '--color-background': resolveSemanticColor(semanticColors.background, mode),
    '--color-surface': resolveSemanticColor(semanticColors.surface, mode),
    '--color-card': resolveSemanticColor(semanticColors.card, mode),
    '--color-foreground': foreground,
    '--color-text-primary': foreground,
    '--color-text-secondary': resolveSemanticColor(semanticColors.textSecondary, mode),
    '--color-border': resolveSemanticColor(semanticColors.border, mode),
    '--color-primary': primary,
    '--color-olive': primary,
    '--color-olive-secondary': resolveSemanticColor(semanticColors.oliveSecondary, mode),
    '--color-accent': accent,
    '--color-gold': accent,
    '--color-success': resolveSemanticColor(semanticColors.success, mode),
    '--color-warning': resolveSemanticColor(semanticColors.warning, mode),
    '--color-danger': resolveSemanticColor(semanticColors.danger, mode),
    '--color-focus': focus,
    '--color-ring': focus,
  }
}

/** Injects Foundation Day semantic CSS variables from design-tokens.ts (single source of truth). */
export const semanticThemePlugin = plugin(({ addBase }) => {
  addBase({
    ':root': semanticCssVariables('light'),
    '.dark': semanticCssVariables('dark'),
  })
})
