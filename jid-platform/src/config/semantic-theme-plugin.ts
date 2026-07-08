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
  return {
    '--color-background': resolveSemanticColor(semanticColors.background, mode),
    '--color-surface': resolveSemanticColor(semanticColors.surface, mode),
    '--color-card': resolveSemanticColor(semanticColors.card, mode),
    '--color-border': resolveSemanticColor(semanticColors.border, mode),
    '--color-text-primary': resolveSemanticColor(semanticColors.textPrimary, mode),
    '--color-text-secondary': resolveSemanticColor(semanticColors.textSecondary, mode),
    '--color-gold': resolveSemanticColor(semanticColors.gold, mode),
    '--color-olive': resolveSemanticColor(semanticColors.olive, mode),
    '--color-danger': resolveSemanticColor(semanticColors.danger, mode),
    '--color-warning': resolveSemanticColor(semanticColors.warning, mode),
  }
}

/** Injects Foundation Day semantic CSS variables from design-tokens.ts (single source of truth). */
export const semanticThemePlugin = plugin(({ addBase }) => {
  addBase({
    ':root': semanticCssVariables('light'),
    '.dark': semanticCssVariables('dark'),
  })
})
