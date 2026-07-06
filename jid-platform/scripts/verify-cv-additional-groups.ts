import { BUILDER_ADDITIONAL_CATEGORIES } from '../src/types/cv'
import { CATEGORY_LABELS, groupAdditional } from '../src/lib/cv/pdf-helpers'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    console.error(`  FAIL  ${label}`)
  }
}

console.log('CV additional PDF grouping verification\n')

const additional = BUILDER_ADDITIONAL_CATEGORIES.map((category, index) => ({
  category,
  title: `${category} item`,
  issuer: 'Issuer',
  description: `Description for ${category}`,
  start_date: '2024-01-15',
  end_date: null,
  url: null,
  sort_order: BUILDER_ADDITIONAL_CATEGORIES.length - index,
}))

const groups = groupAdditional(additional)

assert(groups.length === BUILDER_ADDITIONAL_CATEGORIES.length, 'one group per builder category')

const expectedOrder = [
  'certification',
  'award',
  'leadership',
  'volunteer',
  'project',
  'publication',
] as const

assert(
  groups.map((group) => group.category).join(',') === expectedOrder.join(','),
  'groups follow canonical category order',
)

for (const category of expectedOrder) {
  assert(Boolean(CATEGORY_LABELS.en[category]), `English label for ${category}`)
  assert(groups.find((group) => group.category === category)?.items.length === 1, `${category} has one item`)
}

console.log('\nGroup order:')
for (const group of groups) {
  console.log(`  - ${CATEGORY_LABELS.en[group.category]}`)
}

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
