/**
 * Verifies Section 7.7 education schema + reorder ordering logic.
 * Run: pnpm tsx scripts/verify-cv-education-crud.ts
 */

import { arrayMove } from '@dnd-kit/sortable'
import {
  cvEducationEntrySchema,
  cvEducationReorderSchema,
  educationRecordToFormValues,
  normalizeEducationUpdate,
} from '../src/lib/cv/schemas/education'
import type { CvEducationRecord } from '../src/types/cv'

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

console.log('CV education CRUD verification\n')

const entry = cvEducationEntrySchema.parse({
  institution_name: 'King Saud University',
  institution_city: 'Riyadh',
  institution_country: 'Saudi Arabia',
  degree: 'BSc',
  field_of_study: 'Computer Science',
  graduation_year: 2025,
  gpa_value: 4.5,
  gpa_scale: 5,
  honors: "Dean's List",
  relevant_coursework: 'Algorithms, OS',
  start_month: 9,
  start_year: 2021,
  end_month: 6,
  end_year: 2025,
  is_current: false,
  sort_order: 0,
})

const patch = normalizeEducationUpdate(entry)
assert(patch.institution_city === 'Riyadh', 'institution_city preserved')
assert(patch.honors === "Dean's List", 'honors preserved')
assert(patch.relevant_coursework === 'Algorithms, OS', 'coursework preserved')

const currentEntry = cvEducationEntrySchema.parse({
  ...entry,
  is_current: true,
  end_month: null,
  end_year: null,
})
const currentPatch = normalizeEducationUpdate(currentEntry)
assert(currentPatch.end_month === null, 'is_current clears end_month in patch')
assert(currentPatch.end_year === null, 'is_current clears end_year in patch')

const record: CvEducationRecord = {
  id: '11111111-1111-1111-1111-111111111111',
  cv_id: '22222222-2222-2222-2222-222222222222',
  institution_name: 'A',
  institution_city: null,
  institution_country: null,
  degree: null,
  field_of_study: null,
  graduation_year: null,
  gpa_value: null,
  gpa_scale: null,
  honors: null,
  relevant_coursework: null,
  start_month: null,
  start_year: null,
  end_month: null,
  end_year: null,
  is_current: false,
  sort_order: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const formValues = educationRecordToFormValues(record)
assert(formValues.institution_name === 'A', 'record maps to form values')

const ids = [
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
]
const reordered = cvEducationReorderSchema.parse({ orderedIds: arrayMove(ids, 0, 1) })
assert(reordered.orderedIds[0] === ids[1], 'arrayMove + reorder schema swaps first two ids')
assert(reordered.orderedIds[1] === ids[0], 'arrayMove + reorder schema swaps second id')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
