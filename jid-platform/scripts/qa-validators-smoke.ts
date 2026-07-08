import { bilingualNameSchema, strongPasswordSchema } from '../src/lib/utils/validators'

const nameCases: [string, boolean][] = [
  ['Ahmed Ali', true],
  ['محمد أحمد', true],
  ['John Smith', true],
  ['Ahmed 123', false],
  ['Test@@', false],
  ['A  B', false],
  ['  spaced  ', true],
  ['', false],
]

let failed = 0
for (const [name, expect] of nameCases) {
  const result = bilingualNameSchema.safeParse(name)
  const ok = result.success === expect
  if (!ok) failed++
  console.log(`name: ${JSON.stringify(name)} => ${ok ? 'OK' : 'FAIL'} (got ${result.success})`)
}

const pwCases: [string, boolean][] = [
  ['Abcdef1!', true],
  ['short', false],
  ['abcdefgh', false],
  ['Abcdefgh', false],
]

for (const [pw, expect] of pwCases) {
  const result = strongPasswordSchema.safeParse(pw)
  const ok = result.success === expect
  if (!ok) failed++
  console.log(`pw: ${JSON.stringify(pw)} => ${ok ? 'OK' : 'FAIL'}`)
}

process.exit(failed > 0 ? 1 : 0)
