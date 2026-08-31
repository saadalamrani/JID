import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function load(locale: 'ar' | 'en') {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as {
    smartHeader: { commandPalette: { actions: Record<string, string> } }
    university: { nav: Record<string, string> }
  }
}

function keysOf(value: Record<string, string>): string[] {
  return Object.keys(value).sort()
}

describe('Wave 1 — touched AR/EN message parity', () => {
  it('keeps command-palette quick-action keys in parity without Pulse', () => {
    const en = load('en')
    const ar = load('ar')
    expect(keysOf(en.smartHeader.commandPalette.actions)).toEqual(
      keysOf(ar.smartHeader.commandPalette.actions),
    )
    expect(en.smartHeader.commandPalette.actions.pulse).toBeUndefined()
    expect(ar.smartHeader.commandPalette.actions.pulse).toBeUndefined()
  })

  it('keeps university.nav keys in parity without Directory', () => {
    const en = load('en')
    const ar = load('ar')
    expect(keysOf(en.university.nav)).toEqual(keysOf(ar.university.nav))
    expect(keysOf(en.university.nav)).toEqual(['dashboard', 'reports', 'shellTitle'])
  })
})
