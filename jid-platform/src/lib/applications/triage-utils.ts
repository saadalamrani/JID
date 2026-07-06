import { TRIAGE_FILTER_TABS } from '@/types/application'

export function isTriageFilterTab(value: string): value is (typeof TRIAGE_FILTER_TABS)[number] {
  return (TRIAGE_FILTER_TABS as readonly string[]).includes(value)
}
